import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

/**
 * POST /api/auth/login-with-store
 * Login with store isolation validation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, store_subdomain } = body

    if (!email || !password || !store_subdomain) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // No-op for request
          },
        },
      }
    )

    // 1. Verify store exists
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, subdomain, status")
      .eq("subdomain", store_subdomain)
      .single()

    if (storeError || !store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      )
    }

    if (store.status !== "active") {
      return NextResponse.json(
        { error: "Store is not active" },
        { status: 403 }
      )
    }

    // 2. Attempt login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // 3. CRITICAL: Validate user belongs to THIS store
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, store_id, role")
      .eq("id", authData.user.id)
      .single()

    if (profileError || !profile) {
      // User doesn't have a profile - shouldn't happen
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      )
    }

    // 4. Check if user's store_id matches requested store
    if (profile.store_id !== store.id) {
      // User exists but in a DIFFERENT store - REJECT
      await supabase.auth.signOut()
      return NextResponse.json(
        {
          error: "Access denied",
          message: "This account is registered in a different store. Please sign up for this store separately.",
        },
        { status: 403 }
      )
    }

    // 5. Success - user belongs to this store
    return NextResponse.json({
      success: true,
      user: authData.user,
      profile: {
        id: profile.id,
        role: profile.role,
        store_id: profile.store_id,
      },
      store: {
        id: store.id,
        subdomain: store.subdomain,
      },
      message: "Login successful",
    })
  } catch (error) {
    console.error("Unexpected error in login-with-store:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
