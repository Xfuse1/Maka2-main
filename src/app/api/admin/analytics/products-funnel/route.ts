import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fromParam = searchParams.get("from")
    const toParam = searchParams.get("to")

    const to = toParam ? new Date(toParam) : new Date()
    const from = fromParam ? new Date(fromParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const supabase = getSupabaseAdminClient()

    // 1. Fetch Analytics Events (Views, AddToCart, Checkout)
    const { data: events, error: eventsError } = await supabase
      .from("analytics_events")
      .select("event_name, product_id")
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString())
      .not("product_id", "is", null)

    if (eventsError) throw eventsError

    // 2. Fetch Actual Purchases from order_items
    // Use inner join on orders to filter out cancelled/returned
    const { data: purchaseItems, error: purchasesError } = await supabase
      .from("order_items")
      .select("product_id, quantity, orders!inner(status)")
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString())
      .not("orders.status", "in", '("cancelled","returned","refunded")')

    if (purchasesError) throw purchasesError

    // 3. Fetch Product Details
    // We get unique product IDs from both sources to fetch names
    const productIds = new Set([
      ...((events as any[])?.map(e => e.product_id) || []),
      ...((purchaseItems as any[])?.map(i => i.product_id) || [])
    ].filter(Boolean) as string[])

    // If there are no product IDs, return an empty products array early
    if (productIds.size === 0) {
      return NextResponse.json({ products: [] })
    }

    // Defensive: filter IDs to valid UUID strings because `products.id` is a
    // UUID column. Passing non-UUIDs to Postgres `.in()` will cause a
    // 22P02 invalid input syntax for type uuid error (observed in logs).
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const allIds = Array.from(productIds)
    const uuidIds = allIds.filter((id) => uuidRegex.test(String(id)))
    const nonUuidIds = allIds.filter((id) => !uuidRegex.test(String(id)))

    if (nonUuidIds.length > 0) {
      console.warn(`[products-funnel] skipping ${nonUuidIds.length} non-UUID productIds`, nonUuidIds.slice(0, 10))
    }

    // If there are no UUID product IDs to query, return empty result early.
    if (uuidIds.length === 0) {
      return NextResponse.json({ products: [] })
    }

    // Limit the number of UUIDs we send in the `.in()` clause to avoid huge queries
    const MAX_IDS = 500
    const idsToQuery = uuidIds.length > MAX_IDS ? uuidIds.slice(0, MAX_IDS) : uuidIds
    if (uuidIds.length > MAX_IDS) console.warn(`[products-funnel] limiting UUID productIds from ${uuidIds.length} to ${MAX_IDS}`)

    // Fetch product names for the UUID ID set
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name_ar, name_en")
      .in("id", idsToQuery)

    if (productsError) {
      console.error('[products-funnel] products fetch error:', productsError)
      throw productsError
    }

    const productMap = new Map((products as any[])?.map(p => [p.id, p]))

    // 4. Aggregate Stats
    const statsMap: Record<string, {
      productId: string
      productName: string | null
      views: number
      addToCart: number
      checkout: number
      purchases: number
    }> = {}

    // Initialize with known products
    productIds.forEach(id => {
      const p = productMap.get(id)
      statsMap[id] = {
        productId: id,
        productName: p ? (p.name_ar || p.name_en) : "Unknown Product",
        views: 0,
        addToCart: 0,
        checkout: 0,
        purchases: 0
      }
    })

    // Count Events
    ;(events as any[])?.forEach((e: any) => {
      const id = e.product_id
      if (statsMap[id]) {
        if (e.event_name === "ViewContent") statsMap[id].views++
        else if (e.event_name === "AddToCart") statsMap[id].addToCart++
        else if (e.event_name === "InitiateCheckout") statsMap[id].checkout++
      }
    })

    // Count Purchases
    ;(purchaseItems as any[])?.forEach((item: any) => {
      const id = item.product_id
      if (statsMap[id]) {
        statsMap[id].purchases += (Number(item.quantity) || 1)
      }
    })

    // Calculate Rates and Format
    const funnel = Object.values(statsMap).map(item => ({
      ...item,
      viewToPurchaseRate: item.views > 0 ? (item.purchases / item.views) * 100 : 0
    })).sort((a, b) => b.purchases - a.purchases) // Sort by purchases desc

    return NextResponse.json({ products: funnel })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
