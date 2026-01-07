import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

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

    // إنشاء المستخدم
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: fullName, role: "admin" },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // إنشاء profile مع role = admin
    if (data.user) {
      const profilePayload = {
        id: data.user.id,
        name: fullName,
        role: "admin",
      } as any

      const { data: profileData, error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert(profilePayload)
        .select()

      if (profileError) {
        console.error("Profile creation error:", profileError)
        return NextResponse.json({ error: profileError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error creating admin:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
