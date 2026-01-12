import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

// Compiled regex for better performance (created once, reused)
const STATIC_FILE_REGEX = /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|webp|avif|mp4|webm)$/

// Public paths that don't need authentication (fast lookup with Set)
const PUBLIC_PATHS = new Set([
  "/admin/login",
  "/admin/signup",
])

// Super admin only paths
const SUPER_ADMIN_PATHS = new Set([
  "/super-admin",
  "/create-store",
])

// Public API paths for GET requests
const PUBLIC_GET_API_PATHS = new Set([
  "/api/admin/design/settings",
  "/api/admin/design/logo",
])

// Public API paths for POST requests (special endpoints)
const PUBLIC_POST_API_PATHS = new Set([
  "/api/admin/users/create-admin",  // Admin signup with secret code
  "/api/admin/cache",               // Cache invalidation
])

// Platform domain (التغيير حسب الدومين الفعلي)
const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "makastore.com"
const ENABLE_MULTI_TENANT = process.env.NEXT_PUBLIC_ENABLE_MULTI_TENANT === "true"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get("host") || ""

  // Fast path: Skip static files and public routes early (most common case)
  // This check is optimized to return immediately for most requests
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/fonts") ||
    STATIC_FILE_REGEX.test(pathname)
  ) {
    return NextResponse.next()
  }

  // =============================================================================
  // SUBDOMAIN ROUTING - Multi-Tenant Support
  // =============================================================================
  
  if (ENABLE_MULTI_TENANT) {
    // استخراج subdomain من hostname
    // مثال: store1.makastore.com -> store1
    const subdomain = extractSubdomain(hostname, PLATFORM_DOMAIN)
    
    if (subdomain && subdomain !== "www" && subdomain !== "admin") {
      // هذا طلب لمتجر فرعي (subdomain)
      // IMPORTANT: Allow API routes to pass through without subdomain handling
      // API routes handle their own subdomain logic internally
      if (!pathname.startsWith("/api/")) {
        return handleStoreSubdomain(request, subdomain)
      }
      // For API routes from subdomains, add subdomain header and continue
      const response = NextResponse.next()
      response.headers.set("x-subdomain", subdomain)
      return response
    }
  }
  
  // =============================================================================
  // ADMIN & PLATFORM ROUTES
  // =============================================================================

  // Fast path: Allow public auth pages (no DB query needed)
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  // Check Super Admin paths first (highest security)
  if (SUPER_ADMIN_PATHS.has(pathname)) {
    return handleSuperAdminPath(request, pathname)
  }

  // Fast path: Allow public GET API endpoints
  if (PUBLIC_GET_API_PATHS.has(pathname) && request.method === "GET") {
    return NextResponse.next()
  }

  // Fast path: Allow public POST API endpoints (with their own auth like secret codes)
  if (PUBLIC_POST_API_PATHS.has(pathname) && request.method === "POST") {
    return NextResponse.next()
  }

  // Only create Supabase client when actually needed (admin routes)
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    return NextResponse.next()
  }

  // حماية صفحات الـ admin
  if (pathname.startsWith("/admin")) {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

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
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // التحقق من المستخدم
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // إعادة توجيه لصفحة تسجيل الدخول
      const url = request.nextUrl.clone()
      url.pathname = "/admin/login"
      return NextResponse.redirect(url)
    }

    // التحقق من صلاحيات الـ admin أو store_owner
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, store_id")
      .eq("id", user.id)
      .single()

    // السماح لـ admin و store_owner فقط
    const allowedRoles = ["admin", "store_owner"]
    if (!profile || !allowedRoles.includes(profile.role)) {
      // ليس admin أو store_owner - إعادة توجيه لصفحة تسجيل الدخول
      const url = request.nextUrl.clone()
      url.pathname = "/admin/login"
      return NextResponse.redirect(url)
    }

    // إضافة معلومات الدور والمتجر للـ headers
    response.headers.set("x-user-role", profile.role)
    if (profile.store_id) {
      response.headers.set("x-user-store-id", profile.store_id)
    }

    return response
  }

  // حماية API الخاصة بالـ admin — تمنع الوصول للعامة وتعيد 401/403
  if (pathname.startsWith("/api/admin")) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll() {
              // noop for middleware
            },
          },
        }
      )

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, store_id")
        .eq("id", user.id)
        .single()

      // السماح لـ admin و store_owner فقط
      const allowedRoles = ["admin", "store_owner"]
      if (!profile || !allowedRoles.includes(profile.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      // إضافة معلومات الدور والمتجر للـ headers للـ APIs
      const response = NextResponse.next()
      response.headers.set("x-user-role", profile.role)
      if (profile.store_id) {
        response.headers.set("x-user-store-id", profile.store_id)
      }
      return response

      return NextResponse.next()
    } catch (e) {
      console.error("[middleware] api/admin auth error:", e)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  return NextResponse.next()
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * استخراج subdomain من hostname
 * @param hostname - مثال: store1.makastore.com أو store1.localhost:3000
 * @param platformDomain - مثال: makastore.com أو localhost
 * @returns subdomain أو null
 */
function extractSubdomain(hostname: string, platformDomain: string): string | null {
  // إزالة port إن وجد
  const hostWithoutPort = hostname.split(":")[0]
  
  // التعامل مع localhost بشكل خاص
  if (platformDomain === "localhost") {
    // مثال: store1.localhost -> store1
    if (hostWithoutPort.endsWith(".localhost")) {
      const subdomain = hostWithoutPort.replace(".localhost", "")
      if (subdomain && subdomain !== "www") {
        return subdomain
      }
    }
    return null
  }
  
  // في حالة الدومين العادي (production)
  if (hostWithoutPort === "localhost" || hostWithoutPort === "127.0.0.1") {
    return null
  }
  
  // إزالة www. إن وجد
  const cleanHost = hostWithoutPort.replace(/^www\./, "")
  
  // التحقق من أن hostname ينتهي بالـ platform domain
  if (!cleanHost.endsWith(platformDomain)) {
    return null
  }
  
  // استخراج subdomain
  const subdomain = cleanHost.replace(`.${platformDomain}`, "")
  
  // إذا كان subdomain فارغ أو يساوي platform domain، يعني نحن على الدومين الرئيسي
  if (!subdomain || subdomain === platformDomain) {
    return null
  }
  
  return subdomain
}

/**
 * Handle Super Admin protected paths
 */
async function handleSuperAdminPath(
  request: NextRequest,
  pathname: string
): Promise<NextResponse> {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

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
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // التحقق من المستخدم
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // إعادة توجيه لصفحة تسجيل الدخول
      const url = request.nextUrl.clone()
      url.pathname = "/admin/login"
      url.searchParams.set("redirect", pathname)
      return NextResponse.redirect(url)
    }

    // التحقق من دور super_admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    // السماح لـ super_admin فقط
    if (!profile || profile.role !== "super_admin") {
      // ليس super_admin - إعادة توجيه للصفحة الرئيسية
      const url = request.nextUrl.clone()
      url.pathname = "/"
      return NextResponse.redirect(url)
    }

    // إضافة معلومات الدور للـ headers
    response.headers.set("x-user-role", profile.role)
    response.headers.set("x-is-super-admin", "true")

    return response
  } catch (error) {
    console.error("[middleware] Super Admin auth error:", error)
    const url = request.nextUrl.clone()
    url.pathname = "/admin/login"
    return NextResponse.redirect(url)
  }
}

/**
 * معالجة طلبات المتاجر الفرعية (subdomains)
 */
async function handleStoreSubdomain(request: NextRequest, subdomain: string) {
  const { pathname, search } = request.nextUrl
  
  // إنشاء Supabase client للتحقق من المتجر
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // noop for middleware
        },
      },
    }
  )
  
  try {
    // البحث عن المتجر في قاعدة البيانات
    const { data: store, error } = await supabase
      .from("stores")
      .select("id, store_name, status, subdomain, slug, primary_color, secondary_color, logo_url")
      .eq("subdomain", subdomain)
      .single()
    
    // إذا لم يوجد المتجر أو حدث خطأ
    if (error || !store) {
      console.error(`[middleware] Store not found for subdomain: ${subdomain}`, error)
      
      // إعادة توجيه لصفحة 404 مخصصة للمتاجر غير الموجودة
      const url = request.nextUrl.clone()
      url.pathname = "/store-not-found"
      return NextResponse.rewrite(url)
    }
    
    // التحقق من حالة المتجر
    if (store.status !== "active") {
      console.warn(`[middleware] Store ${subdomain} is not active. Status: ${store.status}`)
      
      const url = request.nextUrl.clone()
      if (store.status === "suspended") {
        url.pathname = "/store-suspended"
      } else if (store.status === "cancelled") {
        url.pathname = "/store-cancelled"
      } else {
        url.pathname = "/store-pending"
      }
      return NextResponse.rewrite(url)
    }
    
    // إعادة توجيه /auth إلى /store-auth للمتاجر الفرعية
    if (pathname === "/auth" || pathname === "/auth/") {
      const url = request.nextUrl.clone()
      url.pathname = "/store-auth"
      return NextResponse.rewrite(url)
    }
    
    // المتجر موجود ونشط - إضافة معلومات المتجر للـ headers
    const response = NextResponse.next()
    response.headers.set("x-store-id", store.id)
    response.headers.set("x-store-subdomain", store.subdomain)
    response.headers.set("x-store-slug", store.slug)
    response.headers.set("x-store-name", encodeURIComponent(store.store_name))
    
    // إضافة ألوان المتجر للتخصيص
    if (store.primary_color) {
      response.headers.set("x-store-primary-color", store.primary_color)
    }
    if (store.secondary_color) {
      response.headers.set("x-store-secondary-color", store.secondary_color)
    }
    if (store.logo_url) {
      response.headers.set("x-store-logo-url", store.logo_url)
    }
    
    console.log(`[middleware] Store found: ${store.store_name} (${subdomain}) - ID: ${store.id}`)
    
    return response
    
  } catch (error) {
    console.error(`[middleware] Error fetching store for subdomain ${subdomain}:`, error)
    
    // في حالة الخطأ، نسمح بالمتابعة لكن بدون معلومات المتجر
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Optimized matcher - only match routes that need middleware processing:
     * - /admin/* (admin pages that need auth)
     * - /api/admin/* (admin API routes that need auth)
     * - All other routes for subdomain detection
     * Excludes all static files and public routes for better performance
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
