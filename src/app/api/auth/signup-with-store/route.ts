import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

/**
 * POST /api/auth/signup-with-store
 * Signup with store isolation - user account is tied to specific store
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, store_subdomain } = body

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

    // 2. Check if email already exists in auth.users
    // Note: In Supabase, email must be unique across ALL stores in auth.users
    // So we can't have same email in different stores with current setup
    // We need to check if this email exists at all
    const { data: { users }, error: checkError } = await supabase.auth.admin.listUsers()
    
    const existingUser = users?.find(u => u.email === email)
    
    if (existingUser) {
      // Check if this user already has a profile in ANY store
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, store_id")
        .eq("id", existingUser.id)
        .single()

      if (existingProfile) {
        if (existingProfile.store_id === store.id) {
          return NextResponse.json(
            { error: "This email is already registered in this store" },
            { status: 409 }
          )
        } else {
          return NextResponse.json(
            { 
              error: "This email is already registered in another store",
              message: "Please use a different email address or login to your existing store"
            },
            { status: 409 }
          )
        }
      }
    }

    // 3. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })

    if (authError) {
      console.error("Auth signup error:", authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      )
    }

    // 4. IMPORTANT: Create profile with store_id using service role
    // We need to use service role client to bypass RLS
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // No-op
          },
        },
      }
    )

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: authData.user.id,
        name,
        store_id: store.id,
        role: "user",
      })

    if (profileError) {
      console.error("Profile creation error:", profileError)
      
      // Rollback: delete the auth user if profile creation failed
      await supabase.auth.admin.deleteUser(authData.user.id)
      
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: authData.user,
      store: {
        id: store.id,
        subdomain: store.subdomain,
      },
      message: "Account created successfully for this store",
    })
  } catch (error) {
    console.error("Unexpected error in signup-with-store:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
