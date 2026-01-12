import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, getStoreIdFromRequest } from "@/lib/supabase/admin"

// GET - Fetch paginated products with filtering (filtered by store)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const categoryId = searchParams.get('category')
    const featured = searchParams.get('featured')
    const offset = (page - 1) * limit

    const supabase = createAdminClient()
    const storeId = await getStoreIdFromRequest()

    // Build base query for products with category
    let query = supabase
      .from("products")
      .select("*, category:categories(name_ar, name_en)", { count: 'exact' })
      .eq('store_id', storeId)

    // Apply filters
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }
    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    // Apply pagination
    const { data: products, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 }
      }, { status: 200 })
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

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }, {
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
