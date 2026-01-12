"use client"

import { useStore } from "@/lib/store-context"
import { createClient } from "@/lib/supabase/client"
import { useMemo } from "react"

/**
 * Hook to get store-filtered Supabase queries
 * This ensures all queries are automatically filtered by the current store
 */
export function useStoreQuery() {
  const { store } = useStore()
  const supabase = createClient()

  /**
   * Fetch products for the current store
   */
  const fetchProducts = async (options?: {
    isActive?: boolean
    isFeatured?: boolean
    limit?: number
    categoryId?: string
  }) => {
    // Fetch products first
    let query = supabase
      .from("products")
      .select(`
        id,
        name_ar,
        name_en,
        slug,
        base_price,
        compare_at_price,
        is_featured,
        is_active,
        category_id,
        created_at
      `)

    // Filter by store
    if (store?.id) {
      query = query.eq("store_id", store.id)
    }

    // Apply additional filters
    if (options?.isActive !== undefined) {
      query = query.eq("is_active", options.isActive)
    }
    if (options?.isFeatured !== undefined) {
      query = query.eq("is_featured", options.isFeatured)
    }
    if (options?.categoryId) {
      query = query.eq("category_id", options.categoryId)
    }
    if (options?.limit) {
      query = query.limit(options.limit)
    }

    query = query.order("created_at", { ascending: false })

    const { data: products, error } = await query

    if (error || !products || products.length === 0) {
      return { data: products, error }
    }

    // Fetch images separately (workaround for partitioned tables)
    type ProductRow = { id: string; name_ar: string; name_en: string | null; slug: string | null; base_price: number; compare_at_price: number | null; is_featured: boolean; is_active: boolean; category_id: string | null; created_at: string }
    type ImageRow = { product_id: string; image_url: string; display_order: number }

    const typedProducts = products as ProductRow[]
    const productIds = typedProducts.map(p => p.id)
    const { data: imagesData } = await supabase
      .from("product_images")
      .select("product_id, image_url, display_order")
      .in("product_id", productIds)
      .order("display_order", { ascending: true })

    const images = (imagesData || []) as ImageRow[]

    // Attach images to products
    const productsWithImages = typedProducts.map(p => ({
      ...p,
      product_images: images.filter(img => img.product_id === p.id)
    }))

    return { data: productsWithImages, error: null }
  }

  /**
   * Fetch categories for the current store
   */
  const fetchCategories = async (options?: {
    isActive?: boolean
    limit?: number
  }) => {
    let query = supabase
      .from("categories")
      .select("*")

    // Filter by store
    if (store?.id) {
      query = query.eq("store_id", store.id)
    }

    // Apply additional filters
    if (options?.isActive !== undefined) {
      query = query.eq("is_active", options.isActive)
    }
    if (options?.limit) {
      query = query.limit(options.limit)
    }

    query = query.order("display_order", { ascending: true })

    return query
  }

  /**
   * Fetch orders for the current store
   */
  const fetchOrders = async (options?: {
    status?: string
    limit?: number
  }) => {
    let query = supabase
      .from("orders")
      .select(`
        *,
        order_items(*)
      `)

    // Filter by store
    if (store?.id) {
      query = query.eq("store_id", store.id)
    }

    // Apply additional filters
    if (options?.status) {
      query = query.eq("status", options.status)
    }
    if (options?.limit) {
      query = query.limit(options.limit)
    }

    query = query.order("created_at", { ascending: false })

    return query
  }

  /**
   * Fetch homepage sections for the current store
   */
  const fetchHomepageSections = async (options?: {
    isActive?: boolean
  }) => {
    let query = supabase
      .from("homepage_sections")
      .select("*")

    // Filter by store (or null for legacy data)
    if (store?.id) {
      query = query.or(`store_id.eq.${store.id},store_id.is.null`)
    }

    // Apply additional filters
    if (options?.isActive !== undefined) {
      query = query.eq("is_active", options.isActive)
    }

    query = query.order("display_order", { ascending: true })

    return query
  }

  /**
   * Fetch hero slides for the current store
   */
  const fetchHeroSlides = async (options?: {
    isActive?: boolean
    limit?: number
  }) => {
    let query = supabase
      .from("hero_slides")
      .select("*")

    // Filter by store (or null for legacy data)
    if (store?.id) {
      query = query.or(`store_id.eq.${store.id},store_id.is.null`)
    }

    // Apply additional filters
    if (options?.isActive !== undefined) {
      query = query.eq("is_active", options.isActive)
    }
    if (options?.limit) {
      query = query.limit(options.limit)
    }

    query = query.order("display_order", { ascending: true })

    return query
  }

  /**
   * Fetch design settings for the current store
   */
  const fetchDesignSettings = async () => {
    let query = supabase
      .from("design_settings")
      .select("*")

    // Filter by store (or null for legacy data)
    if (store?.id) {
      query = query.or(`store_id.eq.${store.id},store_id.is.null`)
    }

    return query.single()
  }

  /**
   * Fetch store settings for the current store
   */
  const fetchStoreSettings = async () => {
    let query = supabase
      .from("store_settings")
      .select("*")

    // Filter by store (or null for legacy data)
    if (store?.id) {
      query = query.or(`store_id.eq.${store.id},store_id.is.null`)
    }

    return query.single()
  }

  /**
   * Fetch cart items for the current store and user
   */
  const fetchCartItems = async (userId?: string, sessionId?: string) => {
    let query = supabase
      .from("cart_items")
      .select("*")

    // Filter by store
    if (store?.id) {
      query = query.eq("store_id", store.id)
    }

    // Filter by user or session
    if (userId) {
      query = query.eq("user_id", userId)
    } else if (sessionId) {
      query = query.eq("session_id", sessionId)
    }

    const { data: cartItems, error } = await query

    if (error || !cartItems || cartItems.length === 0) {
      return { data: cartItems, error }
    }

    // Fetch variants separately (workaround for partitioned tables)
    type CartItemRow = { id: string; variant_id: string | null; quantity: number; [key: string]: unknown }
    type VariantRow = { id: string; [key: string]: unknown }

    const typedCartItems = cartItems as CartItemRow[]
    const variantIds = typedCartItems.map(item => item.variant_id).filter(Boolean) as string[]
    if (variantIds.length > 0) {
      const { data: variantsData } = await supabase
        .from("product_variants")
        .select("*")
        .in("id", variantIds)

      const variants = (variantsData || []) as VariantRow[]

      // Attach variants to cart items
      const cartItemsWithVariants = typedCartItems.map(item => ({
        ...item,
        product_variants: variants.find(v => v.id === item.variant_id) || null
      }))

      return { data: cartItemsWithVariants, error: null }
    }

    return { data: cartItems, error: null }
  }

  /**
   * Insert data with store_id automatically included
   */
  const insertWithStore = async (table: string, data: Record<string, unknown> | Record<string, unknown>[]) => {
    const dataArray = Array.isArray(data) ? data : [data]
    const dataWithStoreId = dataArray.map(item => ({
      ...item,
      store_id: store?.id || null,
    }))

    return supabase.from(table).insert(dataWithStoreId)
  }

  return {
    store,
    storeId: store?.id || null,
    supabase,
    fetchProducts,
    fetchCategories,
    fetchOrders,
    fetchHomepageSections,
    fetchHeroSlides,
    fetchDesignSettings,
    fetchStoreSettings,
    fetchCartItems,
    insertWithStore,
  }
}

/**
 * Get store ID from context (for use in non-hook contexts)
 */
export function getStoreIdFromUrl(): string | null {
  if (typeof window === "undefined") return null
  
  const hostname = window.location.hostname
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "makastore.com"
  
  // Handle localhost with subdomain
  if (platformDomain === "localhost" || hostname.endsWith(".localhost")) {
    if (hostname.endsWith(".localhost")) {
      const subdomain = hostname.replace(".localhost", "")
      if (subdomain && subdomain !== "www") {
        return subdomain // Return subdomain, not store_id
      }
    }
    return null
  }
  
  // Production domain handling
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
