import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function POST(request: NextRequest) {
  try {
    // الحصول على البيانات من الطلب
    const body = await request.json()
    const { store_name, subdomain, slug, phone, description, plan_id } = body

    // التحقق من البيانات المطلوبة
    if (!store_name || !subdomain || !slug) {
      return NextResponse.json(
        { error: "Missing required fields (store_name, subdomain, slug)" },
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

    // Create Supabase client to authenticate the user
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

    // Get the authenticated user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[API] User not authenticated:", authError)
      return NextResponse.json(
        { error: "User must be logged in to create a store" },
        { status: 401 }
      )
    }

    console.log("[API] User authenticated:", user.id)

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

    // Check if user already owns a store (optional - remove if allowing multiple stores per user)
    const { data: existingStore } = await supabaseAdmin
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)

    if (existingStore && existingStore.length > 0) {
      console.warn("[API] User already owns a store:", user.id)
      // You can either:
      // 1. Allow multiple stores per user (comment out this check)
      // 2. Prevent multiple stores (return error below)
      // return NextResponse.json(
      //   { error: "You already own a store. Contact support to create another." },
      //   { status: 400 }
      // )
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
        owner_id: user.id, // استخدام ID المستخدم المسجل دخول
        store_name,
        subdomain,
        slug,
        email: user.email, // استخدام بريد المستخدم المسجل دخول
        phone: phone || null,
        description: description || null,
        status: subscriptionStatus === "trial" ? "active" : "pending", // المتجر نشط فقط للتجربة، والباقي pending
        subscription_status: subscriptionStatus, // subscription_status بدلاً من status
        subscription_plan: selectedPlan?.name_en || "free", // للتوافق مع القديم
        commission_rate: 10.0, // عمولة 10%
        primary_color: "#3b82f6",
        secondary_color: "#10b981",
        trial_ends_at: trialEndsAt,
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

    // تحديث/إنشاء profile للمستخدم مع store_id
    console.log("[API] Setting up profile with store_id:", (newStore as any).id, "for user:", user.id)
    
    // Use upsert to handle both create and update in one operation
    // ملاحظة: جدول profiles يستخدم "name" وليس "full_name"
    const { data: profileResult, error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: user.id,
        name: store_name + " Admin",
        role: "store_owner",
        store_id: (newStore as any).id,
      }, {
        onConflict: "id"
      })
      .select()

    if (profileError) {
      console.error("[API] Error upserting profile:", profileError)
    } else {
      console.log("[API] Profile upserted successfully:", profileResult)
    }

    // إنشاء سجل store_admins لربط المستخدم كمدير للمتجر (إذا كان الجدول موجوداً)
    try {
      const { error: adminError } = await supabaseAdmin
        .from("store_admins")
        .insert({
          store_id: (newStore as any).id,
          user_id: user.id,
          email: user.email,
          role: "owner",
          is_active: true,
        } as any)

      if (adminError) {
        console.warn("[API] Info on store admin:", adminError)
        // لا نفشل العملية بسبب هذا
      }
    } catch (adminErr) {
      // Table might not exist, that's okay
      console.log("[API] store_admins table not available:", adminErr)
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

    // تحديد ما إذا كان يحتاج لدفع
    const requiresPayment = selectedPlan && selectedPlan.price > 0

    console.log("[API] Store created successfully:", {
      store_id: (newStore as any).id,
      subdomain,
      user_id: user.id,
      requires_payment: requiresPayment
    })

    return NextResponse.json(
      {
        success: true,
        store: newStore,
        user_id: user.id,
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
