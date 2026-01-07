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

// Public API paths for GET requests
const PUBLIC_GET_API_PATHS = new Set([
  "/api/admin/design/settings",
  "/api/admin/design/logo",
])

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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

  // Fast path: Allow public auth pages (no DB query needed)
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  // Fast path: Allow public GET API endpoints
  if (PUBLIC_GET_API_PATHS.has(pathname) && request.method === "GET") {
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

    // التحقق من صلاحيات الـ admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "admin") {
      // ليس admin - إعادة توجيه لصفحة تسجيل الدخول
      const url = request.nextUrl.clone()
      url.pathname = "/admin/login"
      return NextResponse.redirect(url)
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
        .select("role")
        .eq("id", user.id)
        .single()

      if (!profile || profile.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      return NextResponse.next()
    } catch (e) {
      console.error("[middleware] api/admin auth error:", e)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Optimized matcher - only match routes that need middleware processing:
     * - /admin/* (admin pages that need auth)
     * - /api/admin/* (admin API routes that need auth)
     * Excludes all static files and public routes for better performance
     */
    "/admin/:path*",
    "/api/admin/:path*",
  ],
}
