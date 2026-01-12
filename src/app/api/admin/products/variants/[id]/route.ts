import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, getStoreIdFromRequest } from "@/lib/supabase/admin"

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const storeId = await getStoreIdFromRequest()

    // Sanitize body: remove undefined, NaN, and store_id
    const payload: Record<string, any> = {}
    Object.keys(body || {}).forEach((k) => {
      if (k === 'store_id') return
      const v = (body as any)[k]
      if (v === undefined) return
      if (typeof v === "number" && Number.isNaN(v)) return
      payload[k] = v
    })

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "Empty payload" }, { status: 400 })
    }

    const supabase = createAdminClient()
    
    // First verify the variant belongs to a product owned by this store
    const { data: variant } = await (supabase as any)
      .from("product_variants")
      .select("id, products!inner(store_id)")
      .eq("id", id)
      .eq("products.store_id", storeId)
      .maybeSingle()

    if (!variant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 })
    }

    const { data, error } = await (supabase as any)
      .from("product_variants")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle()

    if (error) {
      console.error("[v0] Admin variant update error:", error)
      return NextResponse.json({ error: error.message ?? String(error) }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (err) {
    console.error("[v0] Admin variant update exception:", err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
