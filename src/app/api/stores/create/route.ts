import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    // الحصول على البيانات من الطلب
    const body = await request.json()
    const { store_name, subdomain, slug, email, phone, description, plan_id } = body

    // التحقق من البيانات المطلوبة
    if (!store_name || !subdomain || !slug || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // إنشاء Supabase client للتحقق من المستخدم
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            )
          },
        },
      }
    )

    // التحقق من تسجيل الدخول
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please login first." },
        { status: 401 }
      )
    }

    // استخدام Admin client للتجاوز RLS policies
    console.log("[API] Creating admin client...")
    console.log("[API] SUPABASE_URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log("[API] SERVICE_ROLE_KEY exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log("[API] SERVICE_ROLE_KEY length:", process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0)
    
    // Create admin client directly to bypass any type restrictions
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
        owner_id: user.id,
        store_name,
        subdomain,
        slug,
        email,
        phone: phone || null,
        description: description || null,
        status: subscriptionStatus === "trial" ? "active" : "inactive", // المتجر نشط فقط للتجربة
        subscription_status: subscriptionStatus,
        subscription_plan_id: selectedPlan?.id || null,
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

    // تحديث role المستخدم ليصبح store_owner وربطه بالمتجر
    const { error: profileError } = await (supabaseAdmin as any)
      .from("profiles")
      .update({ 
        role: "store_owner",
        store_id: (newStore as any).id  // ربط المستخدم بالمتجر
      })
      .eq("id", user.id)

    if (profileError) {
      console.error("[API] Error updating profile role:", profileError)
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
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          amount_paid: selectedPlan.price === 0 ? 0 : null, // للمجاني فقط
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

    return NextResponse.json(
      {
        success: true,
        store: newStore,
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
