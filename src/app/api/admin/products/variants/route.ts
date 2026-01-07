import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// POST - Create product variant
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    // If SKU provided, ensure it's not already used
    if (body?.sku) {
      try {
        const { data: existing, error: selErr } = await (supabase.from("product_variants") as any)
          .select("id")
          .eq("sku", body.sku)
          .limit(1)
          .maybeSingle()

        if (selErr) {
          // log and continue to attempt insert (insert will catch unique constraint)
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
      // Map duplicate key DB error to 409
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
