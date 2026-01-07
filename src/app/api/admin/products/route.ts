import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET - Fetch all products
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"))
    const perPage = Math.max(1, Number(url.searchParams.get("per_page") || "50"))
    const start = (page - 1) * perPage
    const end = start + perPage - 1

    // Use exact count to return total number of products for pagination
    const { data, error, count } = await supabase
      .from("products")
      .select(
        `
        *,
        category:categories(name_ar, name_en),
        product_images(id, image_url, alt_text_ar, display_order, is_primary),
        product_variants(id, name_ar, name_en, size, color, color_hex, price, inventory_quantity, sku)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(start, end)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const total = typeof count === "number" ? count : (data || []).length

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

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { data, error } = await (supabase
      .from("products") as any)
      .insert([
        {
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

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    console.error("[v0] Error:", err)
    const message = err instanceof Error ? err.message : "Failed to create product"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
