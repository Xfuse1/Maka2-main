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
 * GET /api/super-admin/subscriptions
 * Fetch all subscriptions with store and plan details
 */
export async function GET(request: NextRequest) {
  try {
    const isAuthorized = await verifySuperAdminSession(request)
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all subscriptions
    const { data: subscriptions, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching subscriptions:", error)
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
    }

    // Fetch stores and plans separately (workaround for partitioned tables)
    const storeIds = [...new Set((subscriptions || []).map(s => s.store_id).filter(Boolean))]
    const planIds = [...new Set((subscriptions || []).map(s => s.plan_id).filter(Boolean))]

    const [storesResult, plansResult] = await Promise.all([
      storeIds.length > 0
        ? supabaseAdmin.from("stores").select("id, store_name, subdomain, email").in("id", storeIds)
        : { data: [] },
      planIds.length > 0
        ? supabaseAdmin.from("subscription_plans").select("id, name, name_en, price").in("id", planIds)
        : { data: [] }
    ])

    const stores = storesResult.data || []
    const plans = plansResult.data || []

    // Attach store and plan to subscriptions
    const subscriptionsWithDetails = (subscriptions || []).map(sub => ({
      ...sub,
      store: stores.find(s => s.id === sub.store_id) || null,
      plan: plans.find(p => p.id === sub.plan_id) || null
    }))

    // Calculate stats
    const stats = {
      total: subscriptionsWithDetails.length,
      active: subscriptionsWithDetails.filter(s => s.status === "active").length,
      expired: subscriptionsWithDetails.filter(s => s.status === "expired").length,
      pending: subscriptionsWithDetails.filter(s => s.status === "pending").length,
      total_revenue: subscriptionsWithDetails.reduce((sum, s) => sum + (s.amount_paid || 0), 0),
    }

    return NextResponse.json({ subscriptions: subscriptionsWithDetails, stats })
  } catch (error) {
    console.error("Subscriptions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PATCH /api/super-admin/subscriptions
 * Update a subscription (e.g., extend, cancel, activate)
 */
export async function PATCH(request: NextRequest) {
  try {
    const isAuthorized = await verifySuperAdminSession(request)
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { subscription_id, action, ...updates } = body

    if (!subscription_id) {
      return NextResponse.json({ error: "Subscription ID required" }, { status: 400 })
    }

    // Handle different actions
    if (action === "extend") {
      const { extend_days } = updates
      if (!extend_days) {
        return NextResponse.json({ error: "extend_days required" }, { status: 400 })
      }

      const { data: subscription } = await supabaseAdmin
        .from("subscriptions")
        .select("end_date")
        .eq("id", subscription_id)
        .single()

      if (!subscription) {
        return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
      }

      const currentEndDate = new Date(subscription.end_date)
      const newEndDate = new Date(currentEndDate)
      newEndDate.setDate(newEndDate.getDate() + parseInt(extend_days))

      const { error } = await supabaseAdmin
        .from("subscriptions")
        .update({
          end_date: newEndDate.toISOString(),
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription_id)

      if (error) {
        console.error("Error extending subscription:", error)
        return NextResponse.json({ error: "Failed to extend subscription" }, { status: 500 })
      }

      return NextResponse.json({ success: true, new_end_date: newEndDate.toISOString() })
    }

    if (action === "cancel") {
      // Get store_id first
      const { data: subscription } = await supabaseAdmin
        .from("subscriptions")
        .select("store_id")
        .eq("id", subscription_id)
        .single()

      const { error } = await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription_id)

      if (error) {
        console.error("Error cancelling subscription:", error)
        return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 })
      }

      // Also update store status
      if (subscription) {
        await supabaseAdmin
          .from("stores")
          .update({ subscription_status: "cancelled" })
          .eq("id", subscription.store_id)
      }

      return NextResponse.json({ success: true })
    }

    if (action === "activate") {
      // Get store_id first
      const { data: subscription } = await supabaseAdmin
        .from("subscriptions")
        .select("store_id")
        .eq("id", subscription_id)
        .single()

      const { error } = await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription_id)

      if (error) {
        console.error("Error activating subscription:", error)
        return NextResponse.json({ error: "Failed to activate subscription" }, { status: 500 })
      }

      // Also update store status
      if (subscription) {
        await supabaseAdmin
          .from("stores")
          .update({ subscription_status: "active" })
          .eq("id", subscription.store_id)
      }

      return NextResponse.json({ success: true })
    }

    // Generic update
    updates.updated_at = new Date().toISOString()

    const { data: subscription, error } = await supabaseAdmin
      .from("subscriptions")
      .update(updates)
      .eq("id", subscription_id)
      .select()
      .single()

    if (error) {
      console.error("Error updating subscription:", error)
      return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error("Update subscription error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
