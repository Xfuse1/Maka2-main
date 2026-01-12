import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient, getStoreIdFromRequest } from "@/lib/supabase/admin"

// POST - Create product image (with store_id)
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const storeId = await getStoreIdFromRequest()

    // Verify product belongs to current store before adding image
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", body.product_id)
      .eq("store_id", storeId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: "المنتج غير موجود أو لا يمكنك تعديله" }, { status: 404 })
    }

    const { data, error } = await (supabase
      .from("product_images") as any)
      .insert([
        {
          store_id: storeId, // Add store_id for multi-tenant
          product_id: body.product_id,
          image_url: body.image_url,
          alt_text_ar: body.alt_text_ar,
          alt_text_en: body.alt_text_en,
          display_order: body.display_order,
          is_primary: body.is_primary,
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
    const message = err instanceof Error ? err.message : "Failed to create image"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
