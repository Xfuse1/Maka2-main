import { getSupabaseBrowserClient } from "./client"

export type ProductWithDetails = {
  id: string
  name_ar: string
  name_en: string
  slug: string
  description_ar: string | null
  description_en: string | null
  category_id: string | null
  base_price: number
  is_featured: boolean
  is_active: boolean
  free_shipping?: boolean
  shipping_type?: "free" | "paid" | null
  shipping_cost?: number | null
  created_at: string
  category?: {
    name_ar: string
    name_en: string
  }
  product_images: Array<{
    id: string
    image_url: string
    alt_text_ar?: string | null
    display_order: number
    is_primary: boolean
  }>
  product_variants: Array<{
    id: string
    name_ar: string
    name_en: string
    size: string | null
    color: string | null
    color_hex: string | null
    price: number
    inventory_quantity: number
    sku?: string | null
  }>
}

export type CreateProductData = {
  name_ar: string
  name_en: string
  slug: string
  description_ar: string | null
  description_en: string | null
  category_id: string | null
  base_price: number
  is_featured?: boolean
  is_active?: boolean
  sku?: string
  inventory_quantity?: number
  shipping_type?: "free" | "paid" | null
  shipping_cost?: number | null
}

export type CreateVariantData = {
  product_id: string
  name_ar: string
  name_en: string
  size: string
  color: string
  color_hex: string
  price: number
  inventory_quantity: number
  sku?: string
}

export type CreateImageData = {
  product_id: string
  image_url: string
  alt_text_ar?: string
  alt_text_en?: string
  display_order: number
  is_primary: boolean
}

// Get all products with details
export type GetAllProductsResult = {
  data: ProductWithDetails[]
  total?: number
  page?: number
  perPage?: number
}

export async function getAllProducts(page = 1, perPage = 50, forceReload = false): Promise<GetAllProductsResult> {
  try {
    const cacheBuster = forceReload ? `&_=${Date.now()}` : ""
    const response = await fetch(`/api/admin/products?page=${page}&per_page=${perPage}${cacheBuster}`)

    if (!response.ok) {
      const body = await response.text().catch(() => null)
      try {
        const parsed = body ? JSON.parse(body) : null
        console.error("[v0] getAllProducts: server error", parsed?.error ?? parsed)
      } catch (e) {
        console.error("[v0] getAllProducts: non-json error body", body)
      }
      return { data: [], total: 0, page, perPage }
    }

    const json = await response.json().catch(() => ({ data: [] }))
    return { data: (json.data || []) as ProductWithDetails[], total: json.total ?? undefined, page: json.page ?? page, perPage: json.perPage ?? perPage }
  } catch (err) {
    console.error("[v0] getAllProducts: fetch failed", err)
    return { data: [], total: 0, page, perPage }
  }
}

// Get product by ID
export async function getProductById(id: string) {
  const response = await fetch(`/api/admin/products/${id}`)
  if (!response.ok) throw new Error("Failed to fetch product")
  const { data } = await response.json()
  return data as ProductWithDetails
}

// Get product name by ID
export async function getProductName(id: number) {
  // Supabase client typings may be strict in this helper; cast to `any` for a simple lookup
  const supabaseAny = getSupabaseBrowserClient() as any
  const { data, error } = await supabaseAny
    .from('products')
    .select('name')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching product name:', error);
    return null;
  }

  return data ? (data as any).name ?? null : null;
}

// Create product
export async function createProduct(productData: CreateProductData) {
  const response = await fetch("/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    // If the API returns a structured error object, stringify it for better messages
    let message = "Failed to create product"
    if (errorBody) {
      if (typeof errorBody.error === "string") message = errorBody.error
      else if (typeof errorBody.message === "string") message = errorBody.message
      else message = JSON.stringify(errorBody.error ?? errorBody)
    }

    throw new Error(message)
  }

  const { data } = await response.json()
  return data
}

// Update product
export async function updateProduct(id: string, productData: Partial<CreateProductData>) {
  const response = await fetch(`/api/admin/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    let message = "Failed to update product"
    if (errorBody) {
      if (typeof errorBody.error === "string") message = errorBody.error
      else if (typeof errorBody.message === "string") message = errorBody.message
      else message = JSON.stringify(errorBody.error ?? errorBody)
    }
    throw new Error(message)
  }

  const { data } = await response.json()
  return data
}

// Delete product
export async function deleteProduct(id: string) {
  const response = await fetch(`/api/admin/products/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    let message = "Failed to delete product"
    if (errorBody) {
      if (typeof errorBody.error === "string") message = errorBody.error
      else if (typeof errorBody.message === "string") message = errorBody.message
      else message = JSON.stringify(errorBody.error ?? errorBody)
    }
    throw new Error(message)
  }
}

// Create product variant
export async function createProductVariant(variantData: CreateVariantData) {
  try {
    const response = await fetch("/api/admin/products/variants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(variantData),
    })

    const responseData = await response.json().catch(() => null)

    if (!response.ok) {
      // Map duplicate-key/database errors to a friendly SKU message
      let message = `HTTP ${response.status}: Failed to create variant`
      if (responseData) {
        const raw = (responseData.error || responseData.message || responseData)?.toString?.() || ""
        const lower = raw.toLowerCase()
        if (response.status === 409 || lower.includes("duplicate key") || lower.includes("sku")) {
          message = "هذا الـ SKU مستخدم بالفعل"
        } else if (typeof responseData.error === "string") {
          message = responseData.error
        } else if (typeof responseData.message === "string") {
          message = responseData.message
        } else {
          message = JSON.stringify(responseData.error ?? responseData)
        }
      }
      throw new Error(message)
    }

    return responseData?.data
  } catch (error) {
    console.error("[v0] Error creating variant:", error)
    throw error
  }
}

// Update product variant
export async function updateProductVarint(id: string, variantData: Partial<CreateVariantData>) {
  // Client-side will call the server API to perform updates to avoid REST/Accept/CORS issues
  // Sanitize payload: remove undefined fields and invalid numbers (NaN)
  const payload: Record<string, any> = {}
  Object.keys(variantData || {}).forEach((key) => {
    const val = (variantData as any)[key]
    if (val === undefined) return
    if (typeof val === "number" && Number.isNaN(val)) return
    payload[key] = val
  })

  if (Object.keys(payload).length === 0) {
    console.warn("[v0] Skipping update: empty payload for variant id=", id)
    return null
  }

  try {
    const res = await fetch(`/api/admin/products/variants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const json = await res.json().catch(() => null)

    if (!res.ok) {
      const msg = json?.error ?? `HTTP ${res.status}`
      console.error("[v0] Server API error updating variant:", msg, "payload=", payload)
      throw new Error(msg)
    }

    return json?.data ?? null
  } catch (err) {
    console.error("[v0] Exception updating variant via server API: id=", id, "payload=", payload, err)
    if (err instanceof Error) throw err
    throw new Error(String(err))
  }
}

// Backwards-compatible alias: original had a typo (`updateProductVarint`).
// Export the correctly-named symbol so callers importing `updateProductVariant`
// continue to work without changing other code.
export const updateProductVariant = updateProductVarint

// Delete product variant
export async function deleteProductVariant(id: string) {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase.from("product_variants").delete().eq("id", id).select()

  if (error) {
    console.error("[v0] Error deleting variant:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    
    // Check if it's a foreign key constraint error
    if (error.code === "23503" && error.message.includes("order_items")) {
      throw new Error("لا يمكن حذف هذا المتغير لأنه مستخدم في طلبات موجودة. يمكنك تقليل الكمية المتاحة إلى 0 بدلاً من الحذف.")
    }
    
    throw new Error(error.message || "فشل حذف المتغير")
  }

  if (!data || data.length === 0) {
    throw new Error("المتغير غير موجود أو تم حذفه مسبقاً")
  }

  return data
}

// Create product image
export async function createProductImage(imageData: CreateImageData) {
  const response = await fetch("/api/admin/products/images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(imageData),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    let message = "Failed to create image"
    if (errorBody) {
      if (typeof errorBody.error === "string") message = errorBody.error
      else if (typeof errorBody.message === "string") message = errorBody.message
      else message = JSON.stringify(errorBody.error ?? errorBody)
    }
    throw new Error(message)
  }

  const { data } = await response.json()
  return data
}

// Delete product image
export async function deleteProductImage(id: string) {
  const supabase = getSupabaseBrowserClient()

  const { error } = await supabase.from("product_images").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting image:", error)
    throw error
  }
}

// Get all categories
export async function getAllCategories() {
  const response = await fetch("/api/admin/categories", {
    cache: 'no-store' // Always fetch fresh data
  })
  if (!response.ok) throw new Error("Failed to fetch categories")
  const { data } = await response.json()
  return data
}

// Search products
export async function searchProducts(query: string) {
  const supabase = getSupabaseBrowserClient()

  // Fetch products with category
  const { data: products, error } = await supabase
    .from("products")
    .select("*, category:categories(name_ar, name_en)")
    .or(`name_ar.ilike.%${query}%,name_en.ilike.%${query}%`)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error searching products:", error)
    throw error
  }

  if (!products || products.length === 0) {
    return [] as ProductWithDetails[]
  }

  // Fetch images and variants separately (workaround for partitioned tables)
  const productIds = products.map((p: { id: string }) => p.id)
  const [imagesResult, variantsResult] = await Promise.all([
    supabase.from("product_images").select("*").in("product_id", productIds),
    supabase.from("product_variants").select("*").in("product_id", productIds)
  ])

  // Attach images and variants to products
  const data = products.map((p: { id: string }) => ({
    ...p,
    product_images: (imagesResult.data || []).filter((img: { product_id: string }) => img.product_id === p.id),
    product_variants: (variantsResult.data || []).filter((v: { product_id: string }) => v.product_id === p.id)
  }))

  return data as ProductWithDetails[]
}
