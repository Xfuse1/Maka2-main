import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, getStoreIdFromRequest, DEFAULT_STORE_ID } from "@/lib/supabase/admin"
import { invalidateProductCache } from "@/lib/cache/products-cache"
import { revalidatePath } from "next/cache"

// Enable revalidation
export const revalidate = 300 // 5 minutes

// GET - Fetch all products (filtered by store_id in multi-tenant mode)
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    // Get store_id from request headers (set by middleware)
    const storeId = await getStoreIdFromRequest()

    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"))
    const perPage = Math.max(1, Number(url.searchParams.get("per_page") || "50"))
    const start = (page - 1) * perPage
    const end = start + perPage - 1

    // Fetch products with category (this relationship works)
    // Filter by store_id for multi-tenant isolation
    const { data: products, error, count } = await supabase
      .from("products")
      .select("*, category:categories(name_ar, name_en)", { count: "exact" })
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .range(start, end)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ data: [], total: 0, page, perPage }, { status: 200 })
    }

    // Fetch images and variants separately (workaround for partitioned tables)
    const productIds = products.map((p: { id: string }) => p.id)
    const [imagesResult, variantsResult] = await Promise.all([
      supabase
        .from("product_images")
        .select("id, product_id, image_url, alt_text_ar, display_order, is_primary")
        .in("product_id", productIds)
        .order("display_order", { ascending: true }),
      supabase
        .from("product_variants")
        .select("id, product_id, name_ar, name_en, size, color, color_hex, price, inventory_quantity, sku")
        .in("product_id", productIds)
    ])

    type ImageRow = { id: string; product_id: string; image_url: string; alt_text_ar: string | null; display_order: number; is_primary: boolean }
    type VariantRow = { id: string; product_id: string; name_ar: string; name_en: string | null; size: string | null; color: string | null; color_hex: string | null; price: number; inventory_quantity: number; sku: string | null }

    const images = (imagesResult.data || []) as ImageRow[]
    const variants = (variantsResult.data || []) as VariantRow[]

    // Attach images and variants to products
    const data = products.map((p: { id: string }) => ({
      ...p,
      product_images: images.filter(img => img.product_id === p.id),
      product_variants: variants.filter(v => v.product_id === p.id)
    }))

    const total = typeof count === "number" ? count : data.length

    return NextResponse.json({ data, total, page, perPage }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch products"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST - Create new product (with store_id for multi-tenant)
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    
    // Get store_id from request headers (set by middleware)
    const storeId = await getStoreIdFromRequest()

    const { data, error } = await (supabase
      .from("products") as any)
      .insert([
        {
          store_id: storeId, // Add store_id for multi-tenant
          name_ar: body.name_ar,
          name_en: body.name_en,
          slug: body.slug,
          description_ar: body.description_ar,
          description_en: body.description_en,
          category_id: body.category_id,
          base_price: body.base_price,
          is_featured: body.is_featured,
          is_active: body.is_active,
          sku: body.sku,
          inventory_quantity: body.inventory_quantity,
          shipping_type: body.shipping_type,
          shipping_cost: body.shipping_cost,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("[v0] Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Invalidate product caches after creating new product
    invalidateProductCache(storeId)
    revalidatePath('/admin/products')
    revalidatePath('/')

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    console.error("[v0] Error:", err)
    const message = err instanceof Error ? err.message : "Failed to create product"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
