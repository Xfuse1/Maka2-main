import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Secret code for admin creation - matches the one in signup page
const ADMIN_SECRET_CODE = process.env.ADMIN_SECRET_CODE || "mecca-admin-2024"

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, secretCode } = await request.json()

    // Verify secret code first (security check)
    if (!secretCode || secretCode !== ADMIN_SECRET_CODE) {
      return NextResponse.json({ error: "الكود السري غير صحيح" }, { status: 403 })
    }

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase environment variables!")
      console.error("NEXT_PUBLIC_SUPABASE_URL:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.error("SUPABASE_SERVICE_ROLE_KEY:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)
      return NextResponse.json({
        error: "Server configuration error. Missing Supabase credentials."
      }, { status: 500 })
    }

    // Use the admin client from lib
    const supabaseAdmin = createAdminClient()

    console.log("[CREATE-ADMIN] Starting user creation for:", email)

    // إنشاء المستخدم
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: fullName, role: "admin" },
    })

    if (error) {
      console.error("[CREATE-ADMIN] Auth error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data.user) {
      console.error("[CREATE-ADMIN] No user returned from createUser")
      return NextResponse.json({ error: "فشل إنشاء المستخدم" }, { status: 500 })
    }

    console.log("[CREATE-ADMIN] User created successfully:", data.user.id)

    // Get default store or create one
    const { data: storeData, error: storeError } = await supabaseAdmin
      .from("stores")
      .select("id")
      .limit(1)
      .single()

    let storeId = storeData?.id

    // If no store exists, create a default one
    if (!storeId) {
      console.log("[CREATE-ADMIN] No store found, creating default store")
      const { data: newStore, error: createStoreError } = await supabaseAdmin
        .from("stores")
        .insert({
          subdomain: "default",
          store_name: "Default Store",
          owner_id: data.user.id,
          status: "active",
        })
        .select("id")
        .single()

      if (createStoreError) {
        console.error("[CREATE-ADMIN] Failed to create default store:", createStoreError)
        // Try to get any existing store as fallback
        const { data: fallbackStore } = await supabaseAdmin
          .from("stores")
          .select("id")
          .limit(1)
          .single()

        storeId = fallbackStore?.id
      } else {
        storeId = newStore.id
      }
    }

    if (!storeId) {
      console.error("[CREATE-ADMIN] No store_id available")
      return NextResponse.json({
        error: "No store available. Please create a store first."
      }, { status: 500 })
    }

    console.log("[CREATE-ADMIN] Using store_id:", storeId)

    // إنشاء profile مع role = admin AND store_id
    const profilePayload = {
      id: data.user.id,
      name: fullName,
      email: email,
      role: "admin",
      store_id: storeId, // ✅ CRITICAL: Must include store_id
    } as any

    console.log("[CREATE-ADMIN] Creating profile with payload:", profilePayload)

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(profilePayload)
      .select()

    if (profileError) {
      console.error("[CREATE-ADMIN] Profile creation error:", profileError)
      // Don't fail - the user exists, they just need to create profile manually
      return NextResponse.json({
        success: true,
        warning: "تم إنشاء المستخدم ولكن فشل إنشاء الملف الشخصي: " + profileError.message
      })
    }

    console.log("[CREATE-ADMIN] Profile created successfully:", profileData)

    return NextResponse.json({ success: true, userId: data.user.id })
  } catch (error: any) {
    console.error("Error creating admin:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
