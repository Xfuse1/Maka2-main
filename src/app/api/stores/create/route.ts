import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    // الحصول على البيانات من الطلب
    const body = await request.json()
    const { store_name, subdomain, slug, email, phone, description } = body

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
        status: "active", // نشط مباشرة (يمكن تغييره لـ pending للموافقة اليدوية)
        subscription_plan: "free", // الباقة المجانية افتراضياً
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

    // إرسال بريد ترحيب (اختياري - يحتاج لإعداد Email Service)
    // await sendWelcomeEmail(email, store_name, subdomain)

    return NextResponse.json(
      {
        success: true,
        store: newStore,
        message: "تم إنشاء المتجر بنجاح!",
        store_url: `https://${subdomain}.${process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "makastore.com"}`,
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
