/**
 * Store Utilities for Multi-Tenant Support
 * 
 * This file provides utility functions for handling multi-tenant store operations
 * across the application (both client and server side).
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/** Default store ID for single-tenant mode or fallback */
export const DEFAULT_STORE_ID = "00000000-0000-0000-0000-000000000001"

/** Check if multi-tenant mode is enabled */
export const isMultiTenantEnabled = (): boolean => {
  return process.env.NEXT_PUBLIC_ENABLE_MULTI_TENANT === "true"
}

/** Get platform domain */
export const getPlatformDomain = (): string => {
  return process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "makastore.com"
}

// =============================================================================
// CLIENT-SIDE UTILITIES
// =============================================================================

/**
 * Extract subdomain from current window location (client-side only)
 */
export function getClientSubdomain(): string | null {
  if (typeof window === "undefined") return null
  
  const hostname = window.location.hostname
  const platformDomain = getPlatformDomain()
  
  // Handle localhost with subdomain (e.g., store1.localhost)
  if (platformDomain === "localhost" || hostname.endsWith(".localhost")) {
    if (hostname.endsWith(".localhost")) {
      const subdomain = hostname.replace(".localhost", "")
      if (subdomain && subdomain !== "www") {
        return subdomain
      }
    }
    return null
  }
  
  // Handle production domain
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

/**
 * Get store ID from localStorage (for client-side persistence)
 */
export function getClientStoreId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("store_id")
}

/**
 * Set store ID in localStorage
 */
export function setClientStoreId(storeId: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem("store_id", storeId)
}

/**
 * Clear store ID from localStorage
 */
export function clearClientStoreId(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("store_id")
}

// =============================================================================
// URL UTILITIES
// =============================================================================

/**
 * Generate store URL from subdomain
 */
export function getStoreUrl(subdomain: string): string {
  const platformDomain = getPlatformDomain()
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
  
  if (platformDomain === "localhost") {
    return `${protocol}://${subdomain}.localhost:3000`
  }
  
  return `${protocol}://${subdomain}.${platformDomain}`
}

/**
 * Generate admin URL for a store
 */
export function getStoreAdminUrl(subdomain: string): string {
  return `${getStoreUrl(subdomain)}/admin`
}

/**
 * Get the main platform URL
 */
export function getPlatformUrl(): string {
  const platformDomain = getPlatformDomain()
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
  
  if (platformDomain === "localhost") {
    return `${protocol}://localhost:3000`
  }
  
  return `${protocol}://${platformDomain}`
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Check if a subdomain is valid
 */
export function isValidSubdomain(subdomain: string): boolean {
  // Must be 3-63 characters, lowercase, alphanumeric with hyphens (not at start/end)
  const regex = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/
  return regex.test(subdomain)
}

/**
 * List of reserved subdomains that cannot be used for stores
 */
export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "admin",
  "api",
  "app",
  "mail",
  "email",
  "smtp",
  "ftp",
  "cdn",
  "assets",
  "static",
  "media",
  "images",
  "files",
  "docs",
  "help",
  "support",
  "status",
  "blog",
  "news",
  "shop",
  "store",
  "dashboard",
  "portal",
  "account",
  "accounts",
  "billing",
  "payment",
  "payments",
  "checkout",
  "cart",
  "order",
  "orders",
  "auth",
  "login",
  "signup",
  "register",
  "signin",
  "signout",
  "logout",
  "oauth",
  "sso",
  "test",
  "demo",
  "staging",
  "dev",
  "development",
  "prod",
  "production",
  "localhost",
])

/**
 * Check if a subdomain is reserved
 */
export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.has(subdomain.toLowerCase())
}

/**
 * Check if a subdomain can be used for a new store
 */
export function canUseSubdomain(subdomain: string): { valid: boolean; error?: string } {
  const lower = subdomain.toLowerCase()
  
  if (!isValidSubdomain(lower)) {
    return {
      valid: false,
      error: "الاسم يجب أن يكون بين 3-63 حرف، يحتوي على أحرف صغيرة وأرقام وشرطات فقط"
    }
  }
  
  if (isReservedSubdomain(lower)) {
    return {
      valid: false,
      error: "هذا الاسم محجوز ولا يمكن استخدامه"
    }
  }
  
  return { valid: true }
}

// =============================================================================
// STORE DATA TYPES
// =============================================================================

export interface StoreInfo {
  id: string
  subdomain: string
  store_name: string
  status: "pending" | "active" | "suspended" | "cancelled"
  logo_url?: string
  primary_color?: string
  secondary_color?: string
}

export interface StoreStats {
  total_products: number
  total_orders: number
  total_revenue: number
  total_customers: number
}
