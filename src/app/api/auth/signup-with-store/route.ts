import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * POST /api/auth/signup-with-store
 * Signup with store isolation - user account is tied to specific store
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, full_name, phone, store_subdomain } = body

    // دعم كلا الحقلين name و full_name
    const userName = full_name || name || ""

    if (!email || !password || !store_subdomain) {
      return NextResponse.json(
        { error: "البريد الإلكتروني وكلمة المرور واسم المتجر مطلوبين" },
        { status: 400 }
      )
    }

    // استخدام service role client لكل العمليات
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // 1. التحقق من وجود المتجر
    const { data: store, error: storeError } = await supabaseAdmin
      .from("stores")
      .select("id, subdomain, status")
      .eq("subdomain", store_subdomain)
      .single()

    if (storeError || !store) {
      console.error("Store lookup error:", storeError)
      return NextResponse.json(
        { error: "المتجر غير موجود" },
        { status: 404 }
      )
    }

    if (store.status !== "active") {
      return NextResponse.json(
        { error: "المتجر غير نشط" },
        { status: 403 }
      )
    }

    // 2. التحقق من عدم وجود البريد مسبقاً
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find((u: any) => u.email === email)

    if (existingUser) {
      // التحقق من وجود profile
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id, store_id")
        .eq("id", existingUser.id)
        .single()

      if (existingProfile) {
        if (existingProfile.store_id === store.id) {
          return NextResponse.json(
            { error: "هذا البريد مسجل بالفعل في هذا المتجر" },
            { status: 409 }
          )
        } else {
          return NextResponse.json(
            { error: "هذا البريد مسجل بالفعل في متجر آخر" },
            { status: 409 }
          )
        }
      }
    }

    // 3. بناء redirect URL
    const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "localhost:3000"
    const redirectUrl =
      process.env.NODE_ENV === "production"
        ? `https://${store_subdomain}.${platformDomain}/auth/callback`
        : `http://${store_subdomain}.localhost:3000/auth/callback`

    console.log("[SignupWithStore] Creating user with redirect:", redirectUrl)

    // 4. إنشاء المستخدم في auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // يحتاج تأكيد البريد
      user_metadata: {
        full_name: userName,
        phone,
        store_id: store.id,
        store_subdomain: store_subdomain,
      },
    })

    if (authError) {
      console.error("[SignupWithStore] Auth error:", authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "فشل إنشاء الحساب" },
        { status: 500 }
      )
    }

    console.log("[SignupWithStore] User created:", authData.user.id)

    // 5. إنشاء الـ profile (باستخدام أسماء الأعمدة الصحيحة)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: authData.user.id,
        name: userName,
        phone_number: phone || null,
        role: "user",
        store_id: store.id,
      })

    if (profileError) {
      console.error("[SignupWithStore] Profile error:", profileError)

      // Rollback - حذف المستخدم
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)

      return NextResponse.json(
        { error: "فشل إنشاء الملف الشخصي: " + profileError.message },
        { status: 500 }
      )
    }

    console.log("[SignupWithStore] Profile created")

    // 6. إضافة المستخدم لجدول store_users (إذا كان الجدول موجود)
    try {
      const { error: storeUserError } = await supabaseAdmin
        .from("store_users")
        .insert({
          store_id: store.id,
          user_id: authData.user.id,
          role: "customer",
          status: "active",
        })

      if (storeUserError) {
        // الجدول قد لا يكون موجود - نتجاهل الخطأ
        console.log("[SignupWithStore] Store users table may not exist, skipping...")
      } else {
        console.log("[SignupWithStore] Store user created")
      }
    } catch (e) {
      console.log("[SignupWithStore] Store users insert skipped")
    }

    // 7. إرسال رابط تأكيد البريد
    // ملاحظة: Supabase يرسل البريد تلقائياً عند createUser إذا email_confirm: false
    // لكن لضمان الـ redirect الصحيح، نستخدم generateLink
    const { error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: redirectUrl,
      },
    })

    if (linkError) {
      console.error("[SignupWithStore] Generate link error:", linkError)
    } else {
      console.log("[SignupWithStore] Confirmation link generated")
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      store: {
        id: store.id,
        subdomain: store.subdomain,
      },
      message: "تم إنشاء الحساب بنجاح! يرجى تأكيد بريدك الإلكتروني.",
      requiresEmailConfirmation: true,
    })
  } catch (error) {
    console.error("[SignupWithStore] Unexpected error:", error)
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع" },
      { status: 500 }
    )
  }
}
