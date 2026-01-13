import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    // الحصول على البيانات من الطلب
    const body = await request.json()
    const { store_name, subdomain, slug, email, password, phone, description, plan_id } = body

    // التحقق من البيانات المطلوبة
    if (!store_name || !subdomain || !slug || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields (store_name, subdomain, email, password)" },
        { status: 400 }
      )
    }

    // التحقق من صحة subdomain (أحرف صغيرة وأرقام وشرطات فقط)
    const subdomainRegex = /^[a-z0-9-]+$/
    if (!subdomainRegex.test(subdomain)) {
      return NextResponse.json(
        { error: "Invalid subdomain format" },
        { status: 400 }
      )
    }

    // التحقق من طول كلمة المرور
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    // استخدام Admin client للتجاوز RLS policies
    console.log("[API] Creating admin client...")
    
    const { createClient } = await import("@supabase/supabase-js")
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        db: {
          schema: 'public'
        }
      }
    )

    // التحقق من توفر subdomain
    const { data: subdomainCheck } = await supabaseAdmin
      .from("stores")
      .select("id")
      .eq("subdomain", subdomain)
      .limit(1)

    if (subdomainCheck && subdomainCheck.length > 0) {
      return NextResponse.json(
        { error: "Subdomain already taken" },
        { status: 400 }
      )
    }

    // التحقق من أن البريد الإلكتروني غير مستخدم
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const emailExists = existingUsers?.users?.some(u => u.email === email)
    
    if (emailExists) {
      return NextResponse.json(
        { error: "Email already registered. Please login or use another email." },
        { status: 400 }
      )
    }

    // إنشاء حساب المستخدم (مدير المتجر)
    console.log("[API] Creating user account for:", email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // تأكيد البريد تلقائياً
      user_metadata: {
        role: "store_admin",
        store_subdomain: subdomain,
      }
    })

    if (authError || !authData.user) {
      console.error("[API] Error creating user:", authError)
      return NextResponse.json(
        { error: "Failed to create admin account: " + (authError?.message || "Unknown error") },
        { status: 500 }
      )
    }

    const userId = authData.user.id
    console.log("[API] User created with ID:", userId)

    // ملاحظة: سيتم تحديث store_id بعد إنشاء المتجر
    // إنشاء profile للمستخدم الجديد (بدون store_id في البداية)
    const { error: profileCreateError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: userId,
        email: email,
        role: "store_owner",
        full_name: store_name + " Admin",
        store_id: null, // سيتم تحديثه لاحقاً
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (profileCreateError) {
      console.error("[API] Error creating profile:", profileCreateError)
      // لا نفشل العملية بسبب الـ profile
    } else {
      console.log("[API] Profile created for user:", userId)
    }

    // جلب بيانات الباقة إذا تم تحديدها
    let selectedPlan = null
    let subscriptionStatus = "pending_payment"
    let trialEndsAt = null

    if (plan_id) {
      const { data: plan } = await supabaseAdmin
        .from("subscription_plans")
        .select("*")
        .eq("id", plan_id)
        .eq("is_active", true)
        .single()

      if (plan) {
        selectedPlan = plan
        // إذا كانت الباقة مجانية أو تجربة (price = 0)، يتم تفعيل المتجر مباشرة
        if (plan.price === 0) {
          subscriptionStatus = "trial"
          // حساب تاريخ انتهاء التجربة
          const trialEnd = new Date()
          trialEnd.setDate(trialEnd.getDate() + plan.duration_days)
          trialEndsAt = trialEnd.toISOString()
        }
      }
    } else {
      // إذا لم يتم تحديد باقة، استخدم الباقة الافتراضية
      const { data: defaultPlan } = await supabaseAdmin
        .from("subscription_plans")
        .select("*")
        .eq("is_default", true)
        .eq("is_active", true)
        .single()

      if (defaultPlan) {
        selectedPlan = defaultPlan
        if (defaultPlan.price === 0) {
          subscriptionStatus = "trial"
          const trialEnd = new Date()
          trialEnd.setDate(trialEnd.getDate() + defaultPlan.duration_days)
          trialEndsAt = trialEnd.toISOString()
        }
      }
    }

    // إنشاء المتجر باستخدام Admin client
    const { data: newStore, error: createError } = await supabaseAdmin
      .from("stores")
      .insert({
        owner_id: userId, // استخدام ID المستخدم الجديد
        store_name,
        subdomain,
        slug,
        email,
        phone: phone || null,
        description: description || null,
        status: subscriptionStatus === "trial" ? "active" : "inactive", // المتجر نشط فقط للتجربة
        subscription_status: subscriptionStatus,
        trial_ends_at: trialEndsAt,
        subscription_plan: selectedPlan?.name_en || "free", // للتوافق مع القديم
        commission_rate: 10.0, // عمولة 10%
        primary_color: "#3b82f6",
        secondary_color: "#10b981",
      } as any)
      .select()
      .single()

    if (createError) {
      console.error("[API] Error creating store:", createError)
      // حذف المستخدم إذا فشل إنشاء المتجر
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: "Failed to create store: " + createError.message },
        { status: 500 }
      )
    }

    // إنشاء store_settings افتراضية للمتجر
    const { error: settingsError } = await supabaseAdmin
      .from("store_settings")
      .insert({
        store_id: (newStore as any).id,
        shipping_fee: 50.0,
        free_shipping_threshold: 500.0,
        tax_rate: 0.0,
        currency: "EGP",
        store_name,
        store_description: description || null,
      } as any)

    if (settingsError) {
      console.error("[API] Error creating store settings:", settingsError)
      // لا نفشل العملية بأكملها إذا فشلت الإعدادات
    }

    // إنشاء design_settings افتراضية للمتجر
    const { error: designError } = await supabaseAdmin
      .from("design_settings")
      .insert({
        store_id: (newStore as any).id,
        primary_color: "#3b82f6",
        secondary_color: "#10b981",
        background_color: "#ffffff",
        text_color: "#1a1a1a",
        heading_font: "Cairo",
        body_font: "Cairo",
        logo_bucket: "site-logo",
        logo_path: `${(newStore as any).id}/logo.png`,
      } as any)

    if (designError) {
      console.error("[API] Error creating design settings:", designError)
      // لا نفشل العملية بأكملها
    }

    // تحديث store_id في profile المستخدم
    console.log("[API] Updating profile with store_id:", (newStore as any).id, "for user:", userId)
    const { error: profileUpdateError, data: updatedProfile } = await (supabaseAdmin as any)
      .from("profiles")
      .update({ 
        store_id: (newStore as any).id  // ربط المستخدم بالمتجر
      })
      .eq("id", userId)
      .select()

    if (profileUpdateError) {
      console.error("[API] Error updating profile store_id:", profileUpdateError)
      // إذا فشل التحديث، تحقق من وجود الـ profile
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()
      
      if (!existingProfile) {
        console.warn("[API] Profile doesn't exist, creating it now with store_id")
        await supabaseAdmin
          .from("profiles")
          .insert({
            id: userId,
            email: email,
            role: "store_owner",
            full_name: store_name + " Admin",
            store_id: (newStore as any).id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
      }
    } else {
      console.log("[API] Profile updated successfully with store_id:", (newStore as any).id)
    }

    // إنشاء سجل store_admins لربط المستخدم كمدير للمتجر
    const { error: adminError } = await supabaseAdmin
      .from("store_admins")
      .insert({
        store_id: (newStore as any).id,
        user_id: userId,
        email: email,
        role: "owner",
        is_active: true,
      } as any)

    if (adminError) {
      console.error("[API] Error creating store admin:", adminError)
      // لا نفشل العملية بسبب هذا
    }

    // إنشاء سجل الاشتراك إذا كانت هناك باقة
    if (selectedPlan) {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + selectedPlan.duration_days)

      const { error: subscriptionError } = await supabaseAdmin
        .from("subscriptions")
        .insert({
          store_id: (newStore as any).id,
          plan_id: selectedPlan.id,
          status: selectedPlan.price === 0 ? "active" : "pending",
          amount: selectedPlan.price,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          payment_method: selectedPlan.price === 0 ? "free" : null,
        } as any)

      if (subscriptionError) {
        console.error("[API] Error creating subscription:", subscriptionError)
      }
    }

    // إرسال بريد ترحيب (اختياري - يحتاج لإعداد Email Service)
    // await sendWelcomeEmail(email, store_name, subdomain)

    // تحديد ما إذا كان يحتاج لدفع
    const requiresPayment = selectedPlan && selectedPlan.price > 0

    console.log("[API] Store created successfully:", {
      store_id: (newStore as any).id,
      subdomain,
      user_id: userId,
      requires_payment: requiresPayment
    })

    return NextResponse.json(
      {
        success: true,
        store: newStore,
        user_id: userId,
        message: "تم إنشاء المتجر بنجاح!",
        store_url: `https://${subdomain}.${process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "xfuse.online"}`,
        requires_payment: requiresPayment,
        plan: selectedPlan ? {
          id: selectedPlan.id,
          name: selectedPlan.name,
          price: selectedPlan.price,
          duration_days: selectedPlan.duration_days,
        } : null,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[API] Unexpected error creating store:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET - للحصول على معلومات المتجر (اختياري)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subdomain = searchParams.get("subdomain")

    if (!subdomain) {
      return NextResponse.json(
        { error: "Missing subdomain parameter" },
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
          setAll() {},
        },
      }
    )

    const { data, error } = await supabase
      .from("stores")
      .select("id, store_name, subdomain, slug, status")
      .eq("subdomain", subdomain)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ store: data })
  } catch (error) {
    console.error("[API] Error fetching store:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
