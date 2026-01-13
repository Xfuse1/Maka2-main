import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

// =============================================================================
// CONSTANTS & CONFIGURATION
// =============================================================================

const STATIC_FILE_REGEX = /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|webp|avif|mp4|webm)$/

const PUBLIC_PATHS = new Set([
  "/admin/login",
  "/admin/signup", 
  "/create-store",
  "/landing",
  "/checkout/subscription",
  "/subscription/success",
  "/subscription/cancel",
  "/store-pending-payment",
  "/store-trial-expired",
  "/store-subscription-expired",
  "/super-admin/login",
])

const SUPER_ADMIN_PATHS = new Set(["/super-admin"])

const PUBLIC_API_PATHS = new Set([
  "/api/admin/design/settings",
  "/api/admin/design/logo",
  "/api/admin/users/create-admin",
  "/api/admin/cache",
  "/api/subscription-plans",
  "/api/stores/create",
  "/api/super-admin/auth/login",
])

const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "makastore.com"
const ENABLE_MULTI_TENANT = process.env.NEXT_PUBLIC_ENABLE_MULTI_TENANT === "true"
const ALLOWED_ROLES = ["admin", "store_owner", "owner", "super_admin"]

// =============================================================================
// MAIN MIDDLEWARE
// =============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get("host") || ""

  // 1. Fast skip for static files
  if (shouldSkipMiddleware(pathname)) {
    return NextResponse.next()
  }

  // 2. Handle subdomain routing for multi-tenant
  if (ENABLE_MULTI_TENANT) {
    const subdomain = extractSubdomain(hostname)
    
    if (subdomain) {
      // Admin routes from subdomains - need store ownership verification
      if (pathname.startsWith("/admin")) {
        // Allow login page without auth
        if (pathname === "/admin/login") {
          return handleStoreSubdomainApi(request, subdomain)
        }
        return handleStoreAdminAuth(request, subdomain)
      }
      // Public design API endpoints from subdomains (no auth required)
      if (
        pathname === "/api/admin/design/settings" ||
        pathname === "/api/admin/design/logo"
      ) {
        return handleStoreSubdomainApi(request, subdomain)
      }
      // Admin API routes from subdomains (requires auth)
      if (pathname.startsWith("/api/admin")) {
        return handleStoreAdminApiAuth(request, subdomain)
      }
      // Other API routes from subdomains - need to lookup store and add x-store-id header
      if (pathname.startsWith("/api/")) {
        return handleStoreSubdomainApi(request, subdomain)
      }
      // Store pages - handle subdomain
      return handleStoreSubdomain(request, subdomain)
    }
    
    // Main domain root -> landing page
    if (pathname === "/" || pathname === "") {
      return NextResponse.rewrite(new URL("/landing", request.url))
    }
  }

  // 3. Public paths - no auth needed
  if (PUBLIC_PATHS.has(pathname) || PUBLIC_API_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  // 4. Super Admin paths (pages)
  if (pathname.startsWith("/super-admin") && !pathname.startsWith("/super-admin/login")) {
    return handleSuperAdminAuth(request)
  }

  // 5. Super Admin API routes - require super admin session
  if (pathname.startsWith("/api/super-admin") && !pathname.includes("/auth/")) {
    return handleSuperAdminApiAuth(request)
  }

  // 6. Admin routes - require authentication
  if (pathname.startsWith("/admin")) {
    return handleAdminAuth(request)
  }

  // 7. Admin API routes - require authentication
  if (pathname.startsWith("/api/admin")) {
    return handleAdminApiAuth(request)
  }

  return NextResponse.next()
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function shouldSkipMiddleware(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/fonts") ||
    STATIC_FILE_REGEX.test(pathname)
  )
}

function extractSubdomain(hostname: string): string | null {
  const hostWithoutPort = hostname.split(":")[0]
  
  // localhost subdomain (e.g., store1.localhost)
  if (hostWithoutPort.endsWith(".localhost")) {
    const subdomain = hostWithoutPort.replace(".localhost", "")
    return subdomain && subdomain !== "www" ? subdomain : null
  }
  
  // Skip plain localhost
  if (hostWithoutPort === "localhost" || hostWithoutPort === "127.0.0.1") {
    return null
  }
  
  // Production domain subdomain
  const cleanHost = hostWithoutPort.replace(/^www\./, "")
  if (!cleanHost.endsWith(PLATFORM_DOMAIN)) {
    return null
  }
  
  const subdomain = cleanHost.replace(`.${PLATFORM_DOMAIN}`, "")
  return subdomain && subdomain !== PLATFORM_DOMAIN ? subdomain : null
}

// =============================================================================
// SUPABASE CLIENT FACTORY
// =============================================================================

function createSupabaseMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
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
          // Update request cookies
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          // Create new response with updated cookies
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          // Set cookies on response
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
            })
          })
        },
      },
    }
  )

  return { supabase, response }
}

// =============================================================================
// AUTH HANDLERS
// =============================================================================

async function handleAdminAuth(request: NextRequest): Promise<NextResponse> {
  const { supabase, response } = createSupabaseMiddlewareClient(request)

  try {
    // Get current user - this also refreshes the session
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return redirectToLogin(request, "/admin/login")
    }

    // Get user profile/role
    const profile = await getUserProfile(supabase, user.id)
    
    if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
      return redirectToLogin(request, "/admin/login")
    }

    // Add user info to headers
    response.headers.set("x-user-role", profile.role)
    if (profile.store_id) {
      response.headers.set("x-user-store-id", profile.store_id)
    }

    return response
  } catch (error) {
    console.error("[middleware] Admin auth error:", error)
    return redirectToLogin(request, "/admin/login")
  }
}

async function handleAdminApiAuth(request: NextRequest): Promise<NextResponse> {
  const { supabase } = createSupabaseMiddlewareClient(request)

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await getUserProfile(supabase, user.id)

    if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const response = NextResponse.next()
    response.headers.set("x-user-role", profile.role)
    if (profile.store_id) {
      response.headers.set("x-user-store-id", profile.store_id)
    }
    
    return response
  } catch (error) {
    console.error("[middleware] Admin API auth error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

async function handleSuperAdminAuth(request: NextRequest): Promise<NextResponse> {
  const sessionToken = request.cookies.get("super_admin_session")?.value

  if (!sessionToken) {
    return redirectToLogin(request, "/super-admin/login")
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  })
  response.headers.set("x-user-role", "super_admin")
  response.headers.set("x-is-super-admin", "true")

  return response
}

async function handleSuperAdminApiAuth(request: NextRequest): Promise<NextResponse> {
  const sessionToken = request.cookies.get("super_admin_session")?.value

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const response = NextResponse.next()
  response.headers.set("x-user-role", "super_admin")
  response.headers.set("x-is-super-admin", "true")

  return response
}

// =============================================================================
// STORE-SPECIFIC ADMIN AUTH (for subdomain admin access)
// =============================================================================

async function handleStoreAdminAuth(request: NextRequest, subdomain: string): Promise<NextResponse> {
  const { supabase } = createSupabaseMiddlewareClient(request)

  try {
    console.log(`[Middleware] handleStoreAdminAuth - subdomain: ${subdomain}`)
    
    // 1. First lookup the store by subdomain
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, subdomain, status")
      .eq("subdomain", subdomain)
      .single()

    if (storeError || !store) {
      console.log(`[Middleware] Store not found for subdomain: ${subdomain}`, storeError)
      return NextResponse.rewrite(new URL("/store-not-found", request.url))
    }

    console.log(`[Middleware] Store found: ${store.id}`)

    // 2. Authenticate user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log(`[Middleware] User not authenticated: ${userError?.message}`)
      return redirectToLogin(request, "/admin/login")
    }

    console.log(`[Middleware] User authenticated: ${user.id}`)

    // 3. Get user profile and verify store ownership
    const profile = await getUserProfile(supabase, user.id)

    console.log(`[Middleware] User profile:`, profile)

    if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
      console.log(`[Middleware] User has no admin role or no profile`)
      return redirectToLogin(request, "/admin/login")
    }

    // 4. CRITICAL: Verify user belongs to this store
    console.log(`[Middleware] Checking store ownership - user.store_id: ${profile.store_id}, store.id: ${store.id}`)
    if (!profile.store_id || profile.store_id !== store.id) {
      // User is logged in but doesn't own this store - redirect to login
      // Sign them out first to clear session
      console.log(`[Middleware] Store ownership check FAILED - signing out user`)
      await supabase.auth.signOut()
      return redirectToLogin(request, "/admin/login")
    }

    console.log(`[Middleware] Store ownership verified! Setting headers and allowing access`)

    // 5. User is authenticated and owns this store - set headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-store-id", store.id)
    requestHeaders.set("x-store-subdomain", store.subdomain)
    requestHeaders.set("x-user-role", profile.role)
    requestHeaders.set("x-user-store-id", profile.store_id)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error("[middleware] Store admin auth error:", error)
    return redirectToLogin(request, "/admin/login")
  }
}

async function handleStoreAdminApiAuth(request: NextRequest, subdomain: string): Promise<NextResponse> {
  const { supabase } = createSupabaseMiddlewareClient(request)

  try {
    // 1. First lookup the store by subdomain
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, subdomain")
      .eq("subdomain", subdomain)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    // 2. Authenticate user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 3. Get user profile and verify store ownership
    const profile = await getUserProfile(supabase, user.id)

    if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 4. CRITICAL: Verify user belongs to this store
    if (!profile.store_id || profile.store_id !== store.id) {
      return NextResponse.json({ error: "Access denied to this store" }, { status: 403 })
    }

    // 5. User is authenticated and owns this store - set headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-store-id", store.id)
    requestHeaders.set("x-store-subdomain", store.subdomain)
    requestHeaders.set("x-user-role", profile.role)
    requestHeaders.set("x-user-store-id", profile.store_id)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error("[middleware] Store admin API auth error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

// =============================================================================
// PROFILE HELPER
// =============================================================================

async function getUserProfile(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<{ role: string; store_id: string | null } | null> {
  // Try profiles table first
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, store_id")
    .eq("id", userId)
    .maybeSingle()

  if (profile) {
    return profile
  }

  // Fallback to store_admins table
  const { data: storeAdmin } = await supabase
    .from("store_admins")
    .select("role, store_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle()

  if (storeAdmin) {
    return {
      role: storeAdmin.role === "owner" ? "store_owner" : storeAdmin.role,
      store_id: storeAdmin.store_id,
    }
  }

  return null
}

// =============================================================================
// REDIRECT HELPER
// =============================================================================

function redirectToLogin(request: NextRequest, loginPath: string): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = loginPath
  return NextResponse.redirect(url)
}

// =============================================================================
// STORE SUBDOMAIN API HANDLER (for API routes from subdomains)
// =============================================================================

async function handleStoreSubdomainApi(
  request: NextRequest,
  subdomain: string
): Promise<NextResponse> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    }
  )

  try {
    const { data: store, error } = await supabase
      .from("stores")
      .select("id, subdomain, slug")
      .eq("subdomain", subdomain)
      .single()

    if (error || !store) {
      // Store not found - pass through without store context
      return NextResponse.next()
    }

    // Add store headers to the REQUEST so API handlers can read them
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-store-id", store.id)
    requestHeaders.set("x-store-subdomain", store.subdomain)
    requestHeaders.set("x-store-slug", store.slug)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error(`[middleware] Store subdomain API error:`, error)
    return NextResponse.next()
  }
}

// =============================================================================
// STORE SUBDOMAIN HANDLER
// =============================================================================

async function handleStoreSubdomain(
  request: NextRequest,
  subdomain: string
): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    }
  )

  try {
    const { data: store, error } = await supabase
      .from("stores")
      .select("id, store_name, status, subdomain, slug, primary_color, secondary_color, logo_url, subscription_status, trial_ends_at")
      .eq("subdomain", subdomain)
      .single()

    if (error || !store) {
      return NextResponse.rewrite(new URL("/store-not-found", request.url))
    }

    // Check subscription status
    const subscriptionStatus = store.subscription_status || "active"

    if (subscriptionStatus === "pending_payment") {
      return NextResponse.rewrite(new URL("/store-pending-payment", request.url))
    }

    if (subscriptionStatus === "trial" && store.trial_ends_at) {
      if (new Date(store.trial_ends_at) < new Date()) {
        return NextResponse.rewrite(new URL("/store-trial-expired", request.url))
      }
    }

    if (subscriptionStatus === "expired") {
      return NextResponse.rewrite(new URL("/store-subscription-expired", request.url))
    }

    // Check store status
    if (store.status !== "active") {
      const statusPages: Record<string, string> = {
        suspended: "/store-suspended",
        cancelled: "/store-cancelled",
      }
      return NextResponse.rewrite(
        new URL(statusPages[store.status] || "/store-pending", request.url)
      )
    }

    // Redirect /auth to /store-auth
    if (pathname === "/auth" || pathname === "/auth/") {
      return NextResponse.rewrite(new URL("/store-auth", request.url))
    }

    // Store is active - add headers to the REQUEST so downstream handlers can read them
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-store-id", store.id)
    requestHeaders.set("x-store-subdomain", store.subdomain)
    requestHeaders.set("x-store-slug", store.slug)
    requestHeaders.set("x-store-name", encodeURIComponent(store.store_name))

    if (store.primary_color) requestHeaders.set("x-store-primary-color", store.primary_color)
    if (store.secondary_color) requestHeaders.set("x-store-secondary-color", store.secondary_color)
    if (store.logo_url) requestHeaders.set("x-store-logo-url", store.logo_url)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error(`[middleware] Store subdomain error:`, error)
    return NextResponse.next()
  }
}

// =============================================================================
// MATCHER CONFIG
// =============================================================================

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
