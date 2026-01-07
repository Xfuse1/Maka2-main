import { getSupabaseBrowserClient } from "./client"
import { getSupabaseAdminClient } from "./admin"

export type Order = {
  id: string
  user_id: string
  items: any
  total_price: number
  status: string
  created_at: string
  shipping_address: string
  shipping_city: string
  shipping_state: string
  shipping_postal_code: string
  shipping_country: string
  billing_address: string
  payment_method: string
  payment_status: string
  // Added fields based on actual schema usage
  order_number?: string
  total?: number
  customer_email?: string
}

export async function createOrder(orderData: Partial<Order>) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("orders").insert([orderData] as any).select().single()
  if (error) {
    const msg = typeof error.message === "string" ? error.message : JSON.stringify(error)
    console.error("[v0] Supabase createOrder error:", error, "->", msg)
    throw new Error(msg)
  }
  return data
}

export async function updateOrderStatus(id: string, status: string) {
  // For admin actions we must use the server-side admin route (service role) because
  // browser client (anon key) may be blocked by RLS. Call the server PATCH route.
  try {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      const msg = body?.error ?? body?.message ?? `HTTP ${res.status} updating order`
      console.error("[v0] updateOrderStatus server error:", body, "->", msg)
      throw new Error(msg)
    }

    const body = await res.json().catch(() => null)
    // server returns { success: true } on success
    if (body && body.success) return body
    return body
  } catch (err: any) {
    const message = err?.message ?? (typeof err === "string" ? err : JSON.stringify(err))
    console.error("[v0] updateOrderStatus fetch error:", err, "->", message)
    throw new Error(message)
  }
}

export async function getOrderById(id: string) {
  // Validate UUID format to prevent "invalid input syntax for type uuid" errors
  if (!id || id === 'undefined' || id === 'null') {
    console.warn('[getOrderById] Invalid order ID provided:', id)
    return null
  }

  try {
    const res = await fetch(`/api/admin/orders/${id}`)
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      const msg = body?.error ?? `HTTP ${res.status}`
      console.error("[v0] getOrderById server error:", body, "->", msg)
      return null
    }

    const body = await res.json().catch(() => null)
    // API returns { order: { ... , items: [...] } }
    if (body && body.order) return body.order as Order
    return null
  } catch (err: any) {
    console.error("[v0] getOrderById fetch error:", err)
    return null
  }
}

export async function getOrdersByEmail(identifier: string) {
  try {
    const res = await fetch(`/api/orders/search?q=${encodeURIComponent(String(identifier))}`)
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new Error(body?.error ?? `HTTP ${res.status}`)
    }
    const body = await res.json()
    return (body.orders || []) as Order[]
  } catch (err) {
    console.error('[getOrdersByEmail] error fetching /api/orders/search', err)
    throw err
  }
}

export async function getOrderItems(orderId: string) {
  if (!orderId) return []
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("order_items").select("*").eq("order_id", orderId)
  if (error) {
    console.error("[v0] Supabase getOrderItems error:", error)
    return []
  }
  return data || []
}

export interface OrderSummary {
  id: string
  orderNumber: string
  status: string
  total: number
  currency: string
  createdAt: string
  itemsCount: number | null
}

export async function getOrdersForUserId(userId: string): Promise<OrderSummary[]> {
  const supabase = getSupabaseAdminClient() as any

  // Select orders for this user
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, order_number, status, total, currency, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error

  if (!orders?.length) return []

  // Optionally load items count from order_items
  const orderIds = orders.map((o: any) => o.id)
  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("order_id, quantity")
    .in("order_id", orderIds)

  if (itemsError) throw itemsError

  const counts = new Map<string, number>()
  items?.forEach((item: any) => {
    counts.set(item.order_id, (counts.get(item.order_id) ?? 0) + (item.quantity ?? 0))
  })

  return orders.map((o: any) => ({
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    total: o.total,
    currency: o.currency ?? "EGP",
    createdAt: o.created_at,
    itemsCount: counts.get(o.id) ?? null,
  }))
}
