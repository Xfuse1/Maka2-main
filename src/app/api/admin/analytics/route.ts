import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fromParam = searchParams.get("from")
    const toParam = searchParams.get("to")

    const to = toParam ? new Date(toParam) : new Date()
    const from = fromParam ? new Date(fromParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Calculate previous period
    const duration = to.getTime() - from.getTime()
    const prevTo = new Date(from.getTime())
    const prevFrom = new Date(from.getTime() - duration)

    const supabase = getSupabaseAdminClient()

    // Fetch Current Period Orders
    const { data: currentOrders, error: currentError } = await supabase
      .from("orders")
      .select("total, created_at")
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString())
      .not("status", "in", '("cancelled","returned","refunded")')

    // Fetch Previous Period Orders
    const { data: prevOrders, error: prevError } = await supabase
      .from("orders")
      .select("total")
      .gte("created_at", prevFrom.toISOString())
      .lte("created_at", prevTo.toISOString())
      .not("status", "in", '("cancelled","returned","refunded")')

    // Fetch Total Products & Customers (Total counts, not time-bound for now, or maybe time-bound for growth?)
    // Instructions say: "products: { total: number }"
    const { count: totalProducts } = await supabase.from("products").select("*", { count: "exact", head: true })
    const { count: totalCustomers } = await supabase.from("customers").select("*", { count: "exact", head: true })

    if (currentError || prevError) {
      return NextResponse.json({ error: currentError?.message || prevError?.message }, { status: 500 })
    }

    // Calculate Stats
    const currentRevenue = (currentOrders as any[] || []).reduce((sum, o) => sum + (Number(o.total) || 0), 0)
    const prevRevenue = (prevOrders as any[] || []).reduce((sum, o) => sum + (Number(o.total) || 0), 0)
    const revenueChange = prevRevenue === 0 ? (currentRevenue > 0 ? 100 : 0) : ((currentRevenue - prevRevenue) / prevRevenue) * 100

    const currentOrdersCount = (currentOrders || []).length
    const prevOrdersCount = (prevOrders || []).length
    const ordersChange = prevOrdersCount === 0 ? (currentOrdersCount > 0 ? 100 : 0) : ((currentOrdersCount - prevOrdersCount) / prevOrdersCount) * 100

    // Daily Breakdown
    const dailyRevenueMap: Record<string, number> = {}
    ;(currentOrders as any[])?.forEach(o => {
      const day = new Date(o.created_at).toISOString().split("T")[0]
      dailyRevenueMap[day] = (dailyRevenueMap[day] || 0) + (Number(o.total) || 0)
    })

    const dailyRevenue = Object.entries(dailyRevenueMap).map(([date, total]) => ({
      date,
      total,
    })).sort((a, b) => a.date.localeCompare(b.date))

    const response = {
      revenue: {
        total: currentRevenue,
        previousTotal: prevRevenue,
        changePercent: revenueChange,
        daily: dailyRevenue
      },
      orders: {
        total: currentOrdersCount,
        previousTotal: prevOrdersCount,
        changePercent: ordersChange
      },
      customers: {
        total: totalCustomers || 0
      },
      products: {
        total: totalProducts || 0
      }
    }

    return NextResponse.json(response)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
