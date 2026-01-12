import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * GET /api/super-admin/subscriptions
 * Fetch all subscriptions with store and plan details
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // Verify super admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch all subscriptions with store and plan details
    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        store:stores(store_name, subdomain, email),
        plan:subscription_plans(name, name_en, price)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching subscriptions:", error)
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
    }

    // Calculate stats
    const stats = {
      total: subscriptions?.length || 0,
      active: subscriptions?.filter(s => s.status === "active").length || 0,
      expired: subscriptions?.filter(s => s.status === "expired").length || 0,
      pending: subscriptions?.filter(s => s.status === "pending").length || 0,
      total_revenue: subscriptions?.reduce((sum, s) => sum + (s.amount_paid || 0), 0) || 0,
    }

    return NextResponse.json({ subscriptions, stats })
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
    const cookieStore = await cookies()
    const body = await request.json()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // Verify super admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { subscription_id, action, ...updates } = body

    if (!subscription_id) {
      return NextResponse.json({ error: "Subscription ID required" }, { status: 400 })
    }

    // Handle different actions
    if (action === "extend") {
      // Extend subscription by specified days
      const { extend_days } = updates
      if (!extend_days) {
        return NextResponse.json({ error: "extend_days required" }, { status: 400 })
      }

      const { data: subscription } = await supabase
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

      const { error } = await supabase
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
      const { error } = await supabase
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
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("store_id")
        .eq("id", subscription_id)
        .single()

      if (subscription) {
        await supabase
          .from("stores")
          .update({ subscription_status: "cancelled" })
          .eq("id", subscription.store_id)
      }

      return NextResponse.json({ success: true })
    }

    if (action === "activate") {
      const { error } = await supabase
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
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("store_id")
        .eq("id", subscription_id)
        .single()

      if (subscription) {
        await supabase
          .from("stores")
          .update({ subscription_status: "active" })
          .eq("id", subscription.store_id)
      }

      return NextResponse.json({ success: true })
    }

    // Generic update
    updates.updated_at = new Date().toISOString()

    const { data: subscription, error } = await supabase
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
