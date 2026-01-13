import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create admin client for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
)

/**
 * Verify Super Admin session from cookie
 */
async function verifySuperAdminSession(request: NextRequest): Promise<boolean> {
  const sessionToken = request.cookies.get("super_admin_session")?.value
  return !!sessionToken
}

/**
 * GET /api/super-admin/stores
 * Fetch all stores with statistics for super admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Verify super admin session
    const isAuthorized = await verifySuperAdminSession(request)
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Fetch all stores using admin client
    const { data: stores, error: storesError } = await supabaseAdmin
      .from("stores")
      .select("*")
      .order("created_at", { ascending: false })

    if (storesError) {
      console.error("Error fetching stores:", storesError)
      return NextResponse.json(
        { error: "Failed to fetch stores" },
        { status: 500 }
      )
    }

    // Fetch statistics for each store
    const storesWithStats = await Promise.all(
      (stores || []).map(async (store) => {
        try {
          const [productsRes, ordersRes, revenueRes] = await Promise.all([
            supabaseAdmin
              .from("products")
              .select("id", { count: "exact", head: true })
              .eq("store_id", store.id),
            supabaseAdmin
              .from("orders")
              .select("id", { count: "exact", head: true })
              .eq("store_id", store.id),
            supabaseAdmin
              .from("orders")
              .select("total")
              .eq("store_id", store.id)
              .eq("status", "completed"),
          ])

          const revenue =
            revenueRes.data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0

          return {
            ...store,
            products_count: productsRes.count || 0,
            orders_count: ordersRes.count || 0,
            revenue: revenue,
          }
        } catch (error) {
          console.error(`Error fetching stats for store ${store.id}:`, error)
          return {
            ...store,
            products_count: 0,
            orders_count: 0,
            revenue: 0,
          }
        }
      })
    )

    // Calculate overall statistics
    const stats = {
      total_stores: storesWithStats.length,
      active_stores: storesWithStats.filter((s) => s.status === "active").length,
      inactive_stores: storesWithStats.filter((s) => s.status !== "active").length,
      total_orders: storesWithStats.reduce((sum, s) => sum + (s.orders_count || 0), 0),
      total_revenue: storesWithStats.reduce((sum, s) => sum + (s.revenue || 0), 0),
      total_products: storesWithStats.reduce((sum, s) => sum + (s.products_count || 0), 0),
    }

    return NextResponse.json({
      success: true,
      stores: storesWithStats,
      stats,
    })
  } catch (error) {
    console.error("Unexpected error in super-admin/stores:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/super-admin/stores
 * Update store status (activate/deactivate)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verify super admin session
    const isAuthorized = await verifySuperAdminSession(request)
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { store_id, status } = body

    if (!store_id || !status) {
      return NextResponse.json(
        { error: "Missing store_id or status" },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ["active", "inactive", "suspended", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be: active, inactive, suspended, or cancelled" },
        { status: 400 }
      )
    }

    // Update store status
    const { data, error } = await supabaseAdmin
      .from("stores")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", store_id)
      .select()
      .single()

    if (error) {
      console.error("Error updating store status:", error)
      return NextResponse.json(
        { error: "Failed to update store status" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      store: data,
      message: `Store status updated to ${status}`,
    })
  } catch (error) {
    console.error("Unexpected error in PATCH super-admin/stores:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/super-admin/stores
 * Delete a store (super admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify super admin session
    const isAuthorized = await verifySuperAdminSession(request)
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get store_id from query params
    const { searchParams } = new URL(request.url)
    const store_id = searchParams.get("store_id")

    if (!store_id) {
      return NextResponse.json(
        { error: "Missing store_id parameter" },
        { status: 400 }
      )
    }

    // Delete store (this will cascade delete related data if ON DELETE CASCADE is set)
    const { error } = await supabaseAdmin
      .from("stores")
      .delete()
      .eq("id", store_id)

    if (error) {
      console.error("Error deleting store:", error)
      return NextResponse.json(
        { error: "Failed to delete store. It may contain related data." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Store deleted successfully",
    })
  } catch (error) {
    console.error("Unexpected error in DELETE super-admin/stores:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
