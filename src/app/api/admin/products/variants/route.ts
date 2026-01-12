import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, getStoreIdFromRequest } from "@/lib/supabase/admin"

// POST - Create product variant (with store_id)
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const storeId = await getStoreIdFromRequest()

    // Verify product belongs to current store before adding variant
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", body.product_id)
      .eq("store_id", storeId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: "المنتج غير موجود أو لا يمكنك تعديله" }, { status: 404 })
    }

    // If SKU provided, ensure it's not already used in this store
    if (body?.sku) {
      try {
        const { data: existing, error: selErr } = await (supabase.from("product_variants") as any)
          .select("id")
          .eq("sku", body.sku)
          .eq("store_id", storeId) // Check within same store only
          .limit(1)
          .maybeSingle()

        if (selErr) {
          console.warn("[v0] SKU check warning:", selErr)
        }

        if (existing) {
          console.warn("[v0] Duplicate SKU detected before insert:", body.sku)
          return NextResponse.json({ error: "هذا الـ SKU مستخدم بالفعل" }, { status: 409 })
        }
      } catch (e) {
        console.warn("[v0] SKU existence check failed:", e)
      }
    }

    const { data, error } = await (supabase.from("product_variants") as any)
      .insert([
        {
          store_id: storeId, // Add store_id for multi-tenant
          product_id: body.product_id,
          name_ar: body.name_ar,
          name_en: body.name_en,
          size: body.size,
          color: body.color,
          color_hex: body.color_hex,
          price: body.price,
          inventory_quantity: body.inventory_quantity,
          sku: body.sku,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("[v0] Supabase error on insert:", error)
      const msg = String(error?.message || "")
      if (msg.toLowerCase().includes("duplicate key") || msg.toLowerCase().includes("unique constraint")) {
        return NextResponse.json({ error: "هذا الـ SKU مستخدم بالفعل" }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    console.error("[v0] Error:", err)
    const message = err instanceof Error ? err.message : "Failed to create variant"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
