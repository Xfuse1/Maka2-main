import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./types"

let browserClient: SupabaseClient<Database> | null = null

// Helper function to get current store subdomain from URL
function getCurrentStoreSubdomain(): string | null {
  if (typeof window === "undefined") return null
  
  const hostname = window.location.hostname
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "makastore.com"
  
  // Handle localhost with subdomain (e.g., store1.localhost)
  if (hostname.endsWith(".localhost")) {
    const subdomain = hostname.replace(".localhost", "")
    if (subdomain && subdomain !== "www") {
      return subdomain
    }
    return null
  }
  
  // Handle localhost without subdomain
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return null
  }
  
  const cleanHost = hostname.replace(/^www\./, "")
  
  if (!cleanHost.endsWith(platformDomain)) {
    return null
  }
  
  const subdomain = cleanHost.replace(`.${platformDomain}`, "")
  
  if (!subdomain || subdomain === platformDomain) {
    return null
  }
  
  return subdomain
}

export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (!browserClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
      )
    }

    // Get current store subdomain for multi-tenant isolation
    const storeSubdomain = getCurrentStoreSubdomain()

    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: "pkce",
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "supabase-auth",
      },
      global: {
        headers: storeSubdomain ? {
          "x-store-subdomain": storeSubdomain,
        } : {},
      },
    })
  }
  return browserClient
}

// Keep the original createClient for backward compatibility
export function createClient(): SupabaseClient<Database> {
  return getSupabaseBrowserClient()
}

// Create a store-specific Supabase client (for explicit store context)
export function createStoreClient(storeId: string, storeSubdomain: string): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
    )
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        "x-store-id": storeId,
        "x-store-subdomain": storeSubdomain,
      },
    },
  })
}

// Reset client (useful when switching stores)
export function resetSupabaseClient() {
  browserClient = null
}

