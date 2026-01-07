import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient()

    // Fetch ViewContent events for the last 30 days
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - 30)

    // Fetch relevant columns to aggregate
    const { data: events, error } = await supabase
      .from("analytics_events")
      .select("product_id, product_name, product_price, product_currency")
      .eq("event_name", "ViewContent")
      .not("product_id", "is", null)
      .gte("created_at", fromDate.toISOString())

    if (error) {
      console.error("[TopViewed] Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Aggregate in memory
    const productMap = new Map<string, {
      productId: string
      name: string | null
      price: number | null
      currency: string | null
      views: number
    }>()

    events?.forEach((event: any) => {
      const id = event.product_id
      if (!productMap.has(id)) {
        productMap.set(id, {
          productId: id,
          name: event.product_name,
          price: event.product_price,
          currency: event.product_currency,
          views: 0
        })
      }
      
      const product = productMap.get(id)!
      product.views++
      
      // Update details if missing (in case some events have nulls)
      if (!product.name && event.product_name) product.name = event.product_name
      if (!product.price && event.product_price) product.price = event.product_price
      if (!product.currency && event.product_currency) product.currency = event.product_currency
    })

    const products = Array.from(productMap.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    return NextResponse.json({ products })

  } catch (error: any) {
    console.error("[TopViewed] Unexpected error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
