"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { getSupabaseBrowserClient, resetSupabaseClient } from "./supabase/client"

// =============================================================================
// TYPES
// =============================================================================

export interface Store {
  id: string
  owner_id: string
  store_name: string
  subdomain: string
  slug: string
  email: string
  phone?: string
  description?: string
  status: "pending" | "active" | "suspended" | "cancelled"
  subscription_plan: string
  commission_rate: number
  logo_url?: string
  favicon_url?: string
  primary_color: string
  secondary_color: string
  total_products: number
  total_orders: number
  total_revenue: number
  created_at: string
  updated_at: string
}

export interface StoreSettings {
  id: string
  store_id: string
  shipping_fee: number
  free_shipping_threshold: number
  tax_rate: number
  currency: string
  store_name?: string
  store_description?: string
}

export interface DesignSettings {
  id: string
  store_id: string
  primary_color: string
  secondary_color: string
  background_color: string
  text_color: string
  heading_font: string
  body_font: string
  logo_bucket: string
  logo_path: string
}

interface StoreContextValue {
  // بيانات المتجر الحالي
  store: Store | null
  storeSettings: StoreSettings | null
  designSettings: DesignSettings | null

  // حالة التحميل
  isLoading: boolean
  error: string | null

  // دوال لإعادة تحميل البيانات
  reloadStore: () => Promise<void>
  reloadSettings: () => Promise<void>
  reloadDesign: () => Promise<void>

  // دالة للحصول على store_id للاستخدام في queries
  getStoreId: () => string | null
}

// =============================================================================
// CONTEXT
// =============================================================================

const StoreContext = createContext<StoreContextValue | undefined>(undefined)

// =============================================================================
// PROVIDER
// =============================================================================

interface StoreProviderProps {
  children: React.ReactNode
  initialStoreId?: string // يمكن تمريره من Server Component
}

export function StoreProvider({ children, initialStoreId }: StoreProviderProps) {
  const [store, setStore] = useState<Store | null>(null)
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null)
  const [designSettings, setDesignSettings] = useState<DesignSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Reset Supabase client on mount to ensure fresh store context
  useEffect(() => {
    resetSupabaseClient()
  }, [])

  const supabase = getSupabaseBrowserClient()

  // دالة لاستخراج subdomain من URL
  const getSubdomain = (): string | null => {
    if (typeof window === "undefined") return null

    const hostname = window.location.hostname
    const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "makastore.com"

    // التعامل مع localhost بشكل خاص - يجب التحقق من .localhost أولاً
    // مثال: food.localhost -> food
    if (hostname.endsWith(".localhost")) {
      const subdomain = hostname.replace(".localhost", "")
      if (subdomain && subdomain !== "www") {
        return subdomain
      }
      return null
    }

    // في بيئة التطوير العادية (localhost بدون subdomain)
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return null
    }

    // إزالة www.
    const cleanHost = hostname.replace(/^www\./, "")

    // إذا لم ينتهي بالـ platform domain
    if (!cleanHost.endsWith(platformDomain)) {
      return null
    }

    // استخراج subdomain
    const subdomain = cleanHost.replace(`.${platformDomain}`, "")

    if (!subdomain || subdomain === platformDomain) {
      return null
    }

    return subdomain
  }

  // دالة لتحميل بيانات المتجر
  const loadStore = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // الحصول على subdomain
      const subdomain = getSubdomain()

      // إذا لم يكن هناك subdomain، نستخدم المتجر الافتراضي
      if (!subdomain) {
        // تحميل المتجر الافتراضي (main subdomain)
        const { data, error: fetchError } = await supabase
          .from("stores")
          .select("*")
          .eq("subdomain", "main")
          .eq("status", "active")
          .single()

        if (fetchError) {
          console.error("[StoreContext] Error fetching default store:", fetchError)
          setError("فشل في تحميل بيانات المتجر")
          return
        }

        setStore(data)
        return
      }

      // تحميل المتجر بناءً على subdomain
      const { data, error: fetchError } = await supabase
        .from("stores")
        .select("*")
        .eq("subdomain", subdomain)
        .single()

      if (fetchError) {
        console.error(`[StoreContext] Error fetching store ${subdomain}:`, fetchError)
        setError(`المتجر "${subdomain}" غير موجود`)
        return
      }

      const storeData = data as any

      // التحقق من حالة المتجر
      if (storeData.status !== "active") {
        setError(`المتجر غير نشط. الحالة: ${storeData.status}`)
        return
      }

      setStore(storeData)
    } catch (err) {
      console.error("[StoreContext] Unexpected error:", err)
      setError("حدث خطأ غير متوقع")
    } finally {
      setIsLoading(false)
    }
  }

  // دالة لتحميل إعدادات المتجر
  const loadSettings = async () => {
    if (!store) return

    try {
      const { data, error: fetchError } = await supabase
        .from("store_settings")
        .select("*")
        .eq("store_id", store.id)
        .single()

      if (fetchError) {
        console.error("[StoreContext] Error fetching store settings:", fetchError)
        return
      }

      setStoreSettings(data)
    } catch (err) {
      console.error("[StoreContext] Error loading settings:", err)
    }
  }

  // دالة لتحميل إعدادات التصميم
  const loadDesign = async () => {
    if (!store) return

    try {
      const { data, error: fetchError } = await supabase
        .from("design_settings")
        .select("*")
        .eq("store_id", store.id)
        .single()

      if (fetchError) {
        console.error("[StoreContext] Error fetching design settings:", fetchError)
        return
      }

      setDesignSettings(data)

      // تطبيق الألوان على CSS Variables
      if (data) {
        applyDesignSettings(data)
      }
    } catch (err) {
      console.error("[StoreContext] Error loading design:", err)
    }
  }

  // دالة لتطبيق إعدادات التصميم على CSS
  const applyDesignSettings = (design: DesignSettings) => {
    if (typeof document === "undefined") return

    const root = document.documentElement
    root.style.setProperty("--primary-color", design.primary_color)
    root.style.setProperty("--secondary-color", design.secondary_color)
    root.style.setProperty("--background-color", design.background_color)
    root.style.setProperty("--text-color", design.text_color)

    // تطبيق الخطوط
    root.style.setProperty("--font-heading", design.heading_font)
    root.style.setProperty("--font-body", design.body_font)
  }

  // دوال إعادة التحميل
  const reloadStore = async () => {
    await loadStore()
  }

  const reloadSettings = async () => {
    await loadSettings()
  }

  const reloadDesign = async () => {
    await loadDesign()
  }

  const getStoreId = (): string | null => {
    return store?.id || null
  }

  // تحميل البيانات عند تحميل المكون
  useEffect(() => {
    loadStore()
  }, [])

  // تحميل Settings و Design عند تحميل Store
  useEffect(() => {
    if (store) {
      loadSettings()
      loadDesign()
    }
  }, [store])

  const value: StoreContextValue = {
    store,
    storeSettings,
    designSettings,
    isLoading,
    error,
    reloadStore,
    reloadSettings,
    reloadDesign,
    getStoreId,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// =============================================================================
// HOOK
// =============================================================================

export function useStore() {
  const context = useContext(StoreContext)

  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider")
  }

  return context
}

// =============================================================================
// SERVER-SIDE HELPERS
// =============================================================================

/**
 * دالة للحصول على store_id من headers في Server Components
 * يتم حقن هذه القيمة من middleware
 */
export function getStoreIdFromHeaders(headers: Headers): string | null {
  return headers.get("x-store-id")
}

export function getStoreSubdomainFromHeaders(headers: Headers): string | null {
  return headers.get("x-store-subdomain")
}

export function getStoreSlugFromHeaders(headers: Headers): string | null {
  return headers.get("x-store-slug")
}
