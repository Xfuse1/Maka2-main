import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient()
    
    // Fetch all data for accurate statistics
    const [
      { data: allOrders, error: ordersError },
      { data: recentOrders, error: recentOrdersError },
      { data: products, error: productsError },
      { data: customers, error: customersError },
      { data: variants, error: variantsError },
    ] = await Promise.all([
      // Get all orders for accurate stats (include created_at)
      supabase
        .from("orders")
        .select("id, total, status, created_at"),
      // Get recent 4 orders for display
      supabase
        .from("orders")
        .select("id, order_number, customer_name, total, status, created_at")
        .order("created_at", { ascending: false })
        .limit(4),
      // products (include inventory if present)
      supabase
        .from("products")
        .select("id, inventory_quantity"),
      // customers with created_at to compute weekly new customers
      supabase
        .from("customers")
        .select("id, created_at"),
      // product variants to compute per-product stock totals
      supabase
        .from("product_variants")
        .select("product_id, inventory_quantity"),
    ])

    // Log errors for debugging
    if (ordersError) console.error('[Dashboard] Orders error:', ordersError)
    if (recentOrdersError) console.error('[Dashboard] Recent orders error:', recentOrdersError)
    if (productsError) console.error('[Dashboard] Products error:', productsError)
    if (customersError) console.error('[Dashboard] Customers error:', customersError)
    if (variantsError) console.error('[Dashboard] Variants error:', variantsError)

    // Calculate accurate stats from all data (gracefully handle missing data)
    // customersList is the full customers list (selected with created_at)
    const customersList = Array.isArray(customers) ? customers : []
    // compute weekly new customers from the full customers list
    const weeklyCustomersCount = customersList.filter((c: any) => {
      const created = c?.created_at ? new Date(c.created_at) : null
      if (!created) return false
      return created >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }).length

    // compute low-stock products using variants sums if available, otherwise fallback to products.inventory_quantity
    let lowStockCount = 0
    if (Array.isArray(variants) && variants.length > 0) {
      const sums: Record<string, number> = {}
      variants.forEach((v: any) => {
        const pid = v?.product_id
        const qty = Number(v?.inventory_quantity || 0)
        if (!pid) return
        sums[pid] = (sums[pid] || 0) + qty
      })
      lowStockCount = Object.values(sums).filter((s) => s < 10).length
    } else if (Array.isArray(products)) {
      lowStockCount = products.filter((p: any) => (p.inventory_quantity || 0) < 10).length
    }

    // compute month-over-month revenue change using order created_at
    const ordersList = Array.isArray(allOrders) ? allOrders : []
    
    // Filter out cancelled/returned/refunded orders for revenue calculations
    const validOrders = ordersList.filter((o: any) => 
      !["cancelled", "returned", "refunded"].includes(String(o.status || "").toLowerCase())
    )

    const now = new Date()
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const revenueThisMonth = validOrders.reduce((sum: number, o: any) => {
      const created = o?.created_at ? new Date(o.created_at) : null
      if (!created) return sum
      if (created >= startOfThisMonth && created < startOfNextMonth) return sum + (o.total || 0)
      return sum
    }, 0)

    const revenueLastMonth = validOrders.reduce((sum: number, o: any) => {
      const created = o?.created_at ? new Date(o.created_at) : null
      if (!created) return sum
      if (created >= startOfLastMonth && created < startOfThisMonth) return sum + (o.total || 0)
      return sum
    }, 0)

    const revenueMoM = revenueLastMonth === 0 ? (revenueThisMonth === 0 ? 0 : 100) : ((revenueThisMonth - revenueLastMonth) / Math.max(1, revenueLastMonth)) * 100

    // pending statuses set (include english 'processing')
    const pendingStatuses = new Set(["pending", "قيد المعالجة", "processing"])
    const pendingCount = ordersList.filter((o: any) => pendingStatuses.has(String(o.status))).length

    const stats = {
      totalProducts: Array.isArray(products) ? products.length : 0,
      totalOrders: ordersList.length,
      totalRevenue: validOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0),
      totalCustomers: customersList.length,
      pendingOrders: pendingCount,
      lowStockProducts: lowStockCount,
      weeklyNewCustomers: weeklyCustomersCount,
      revenueMoM: revenueMoM,
    }

    return NextResponse.json({ 
      stats, 
      recentOrders: Array.isArray(recentOrders) ? recentOrders : [] 
    })
  } catch (error: any) {
    console.error('[Dashboard] Unexpected error:', error)
    return NextResponse.json({ 
      error: error?.message || 'حدث خطأ في تحميل البيانات',
      stats: {
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        pendingOrders: 0,
        lowStockProducts: 0,
      },
      recentOrders: []
    }, { status: 500 })
  }
}
