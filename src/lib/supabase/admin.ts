import { createClient } from "@supabase/supabase-js"
import type { Database } from "./types"

// =============================================================================
// CONSTANTS
// =============================================================================

// Default store ID for single-tenant mode or fallback
export const DEFAULT_STORE_ID = "00000000-0000-0000-0000-000000000001"

// =============================================================================
// ADMIN CLIENT (No Store Context)
// =============================================================================

export function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. " +
      "Please set these in your Vercel project settings or .env.local file."
    )
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// =============================================================================
// STORE ID HELPERS (For Multi-Tenant)
// =============================================================================

/**
 * Get store_id from request headers (set by middleware)
 * Falls back to DEFAULT_STORE_ID if not in multi-tenant mode
 *
 * Priority:
 * 1. x-store-id (from subdomain routing - takes precedence for multi-tenant)
 * 2. x-user-store-id (from store_owner profile - fallback)
 * 3. DEFAULT_STORE_ID (fallback)
 *
 * NOTE: This function dynamically imports next/headers to avoid client-side issues
 */
export async function getStoreIdFromRequest(): Promise<string> {
  try {
    // Dynamic import to avoid issues with client components
    const { headers } = await import("next/headers")
    const headersList = await headers()

    // First check subdomain-based store_id (takes precedence for multi-tenant)
    const storeId = headersList.get("x-store-id")
    if (storeId) {
      return storeId
    }

    // Then check if user is a store_owner (fallback)
    const userStoreId = headersList.get("x-user-store-id")
    return userStoreId || DEFAULT_STORE_ID
  } catch {
    // headers() might fail if called outside request context or in client
    return DEFAULT_STORE_ID
  }
}

/**
 * Get user role from request headers (set by middleware)
 */
export async function getUserRoleFromRequest(): Promise<string | null> {
  try {
    const { headers } = await import("next/headers")
    const headersList = await headers()
    return headersList.get("x-user-role")
  } catch {
    return null
  }
}

/**
 * Get store subdomain from request headers
 */
export async function getStoreSubdomainFromRequest(): Promise<string | null> {
  try {
    const { headers } = await import("next/headers")
    const headersList = await headers()
    return headersList.get("x-store-subdomain")
  } catch {
    return null
  }
}

/**
 * Create admin client with store context for multi-tenant queries
 * Use this when you need to filter data by store_id automatically
 */
export function createStoreAdminClient(storeId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. " +
      "Please set these in your Vercel project settings or .env.local file."
    )
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        "x-store-id": storeId,
      },
    },
  })
}

// =============================================================================
// BACKWARDS-COMPATIBLE ALIASES
// =============================================================================

export const getAdminClient = getSupabaseAdminClient
export const createAdminClient = getSupabaseAdminClient
export const createSupabaseAdmin = getSupabaseAdminClient
export const createSupabaseAdminClient = getSupabaseAdminClient
export const getSupabaseAdmin = getSupabaseAdminClient
