import { NextResponse } from "next/server"
import { getSupabaseAdminClient, getStoreIdFromRequest } from "@/lib/supabase/admin"

const ALLOWED_STATUSES = new Set(["pending", "processing", "shipped", "delivered", "cancelled", "confirmed"])

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("x-admin-secret")
    const expected = process.env.ADMIN_API_SECRET
    if (!expected || secret !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const count = Number(body.count || 1)
    const status = String(body.status || "delivered")

    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    const storeId = await getStoreIdFromRequest()

    // Get last orders by created_at for this store
    const { data: lastOrders, error: selectErr } = await supabase
      .from("orders")
      .select("id")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(count)

    if (selectErr) {
      console.error('[update-last] select error', selectErr)
      return NextResponse.json({ error: selectErr.message }, { status: 500 })
    }

    if (!Array.isArray(lastOrders) || lastOrders.length === 0) {
      return NextResponse.json({ updated: 0, ids: [] })
    }

    const ids = lastOrders.map((r: any) => r.id)

    const { data: updated, error: updateErr } = await (supabase
      .from("orders") as any)
      .update({ status })
      .in("id", ids)
      .eq("store_id", storeId)

    if (updateErr) {
      console.error('[update-last] update error', updateErr)
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ updated: Array.isArray(updated) ? (updated as any[]).length : 0, ids })
  } catch (err: any) {
    console.error('[update-last] unexpected', err)
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 500 })
  }
}
