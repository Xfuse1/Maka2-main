import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fromParam = searchParams.get("from")
    const toParam = searchParams.get("to")

    const to = toParam ? new Date(toParam) : new Date()
    const from = fromParam ? new Date(fromParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default 30 days

    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase
      .from("analytics_events")
      .select("event_name, created_at")
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString())
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const summary = {
      PageView: 0,
      ViewContent: 0,
      AddToCart: 0,
      InitiateCheckout: 0,
      Purchase: 0,
      Search: 0,
    }

    const dailyMap: Record<string, typeof summary> = {}

    data?.forEach((event: any) => {
      const eventName = event.event_name as keyof typeof summary
      if (summary[eventName] !== undefined) {
        summary[eventName]++
      }

      const day = new Date(event.created_at).toISOString().split("T")[0]
      if (!dailyMap[day]) {
        dailyMap[day] = {
          PageView: 0,
          ViewContent: 0,
          AddToCart: 0,
          InitiateCheckout: 0,
          Purchase: 0,
          Search: 0,
        }
      }
      if (dailyMap[day][eventName] !== undefined) {
        dailyMap[day][eventName]++
      }
    })

    const daily = Object.entries(dailyMap).map(([date, counts]) => ({
      date,
      ...counts,
    })).sort((a, b) => a.date.localeCompare(b.date))

    // Funnel calculations
    const views = summary.ViewContent
    const addToCart = summary.AddToCart
    const checkout = summary.InitiateCheckout
    const purchases = summary.Purchase

    const funnel = {
      views,
      addToCart,
      checkout,
      purchases,
      viewToCartRate: views > 0 ? addToCart / views : 0,
      cartToCheckoutRate: addToCart > 0 ? checkout / addToCart : 0,
      checkoutToPurchaseRate: checkout > 0 ? purchases / checkout : 0,
      viewToPurchaseRate: views > 0 ? purchases / views : 0,
    }

    return NextResponse.json({ summary, funnel, daily })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
