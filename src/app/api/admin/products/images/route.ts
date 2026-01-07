import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// POST - Create product image
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { data, error } = await (supabase
      .from("product_images") as any)
      .insert([
        {
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
