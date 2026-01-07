import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET - Fetch paginated products with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const categoryId = searchParams.get('category')
    const featured = searchParams.get('featured')
    const offset = (page - 1) * limit

    const supabase = createAdminClient()
    
    let query = supabase
      .from("products")
      .select(`
        *,
        category:categories(name_ar, name_en),
        product_images!inner(id, image_url, alt_text_ar, display_order, is_primary),
        product_variants(id, name_ar, name_en, size, color, color_hex, price, inventory_quantity, sku)
      `, { count: 'exact' })

    // Apply filters
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }
    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    // Apply pagination
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

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
