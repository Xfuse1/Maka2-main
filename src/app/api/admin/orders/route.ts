import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  const supabase = getSupabaseAdminClient()
  const url = new URL(request.url)
  const qp = url.searchParams
  const limit = Math.max(Number(qp.get("limit") ?? 25), 1)
  const page = Math.max(Number(qp.get("page") ?? 1), 1)
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, order_number, customer_id, customer_email, customer_name, customer_phone,
      status, payment_status, payment_method, subtotal, shipping_cost, tax, discount, total, currency,
      shipping_address_line1, shipping_address_line2, shipping_city, shipping_state, shipping_postal_code, shipping_country,
      billing_address_line1, billing_address_line2, billing_city, billing_state, billing_postal_code, billing_country,
      notes, tracking_number, shipped_at, delivered_at, cancelled_at, created_at
    `)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ orders: data })
}
