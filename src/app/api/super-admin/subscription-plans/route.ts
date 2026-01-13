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
 * GET /api/super-admin/subscription-plans
 * Fetch all subscription plans for super admin
 */
export async function GET(request: NextRequest) {
  try {
    const isAuthorized = await verifySuperAdminSession(request)
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: plans, error } = await supabaseAdmin
      .from("subscription_plans")
      .select("*")
      .order("sort_order", { ascending: true })

    if (error) {
      console.error("Error fetching plans:", error)
      return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 })
    }

    return NextResponse.json({ plans })
  } catch (error) {
    console.error("Subscription plans error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/super-admin/subscription-plans
 * Create a new subscription plan
 */
export async function POST(request: NextRequest) {
  try {
    const isAuthorized = await verifySuperAdminSession(request)
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, name_en, price, duration_days, features, is_active, is_default, sort_order } = body

    if (!name || !name_en || price === undefined || !duration_days) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // If this is default, unset other defaults
    if (is_default) {
      await supabaseAdmin
        .from("subscription_plans")
        .update({ is_default: false })
        .eq("is_default", true)
    }

    const { data: plan, error } = await supabaseAdmin
      .from("subscription_plans")
      .insert({
        name,
        name_en,
        price: parseFloat(price),
        duration_days: parseInt(duration_days),
        features: features || [],
        is_active: is_active ?? true,
        is_default: is_default ?? false,
        sort_order: sort_order || 0,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating plan:", error)
      return NextResponse.json({ error: "Failed to create plan" }, { status: 500 })
    }

    return NextResponse.json({ plan })
  } catch (error) {
    console.error("Create plan error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PATCH /api/super-admin/subscription-plans
 * Update an existing subscription plan
 */
export async function PATCH(request: NextRequest) {
  try {
    const isAuthorized = await verifySuperAdminSession(request)
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Plan ID required" }, { status: 400 })
    }

    // If setting as default, unset other defaults
    if (updates.is_default) {
      await supabaseAdmin
        .from("subscription_plans")
        .update({ is_default: false })
        .neq("id", id)
    }

    // Parse numeric fields
    if (updates.price !== undefined) {
      updates.price = parseFloat(updates.price)
    }
    if (updates.duration_days !== undefined) {
      updates.duration_days = parseInt(updates.duration_days)
    }

    updates.updated_at = new Date().toISOString()

    const { data: plan, error } = await supabaseAdmin
      .from("subscription_plans")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating plan:", error)
      return NextResponse.json({ error: "Failed to update plan" }, { status: 500 })
    }

    return NextResponse.json({ plan })
  } catch (error) {
    console.error("Update plan error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/super-admin/subscription-plans
 * Delete a subscription plan
 */
export async function DELETE(request: NextRequest) {
  try {
    const isAuthorized = await verifySuperAdminSession(request)
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const planId = searchParams.get("id")

    if (!planId) {
      return NextResponse.json({ error: "Plan ID required" }, { status: 400 })
    }

    // Check if plan has active subscriptions
    const { count } = await supabaseAdmin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", planId)
      .eq("status", "active")

    if (count && count > 0) {
      return NextResponse.json(
        { error: "Cannot delete plan with active subscriptions. Deactivate it instead." },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from("subscription_plans")
      .delete()
      .eq("id", planId)

    if (error) {
      console.error("Error deleting plan:", error)
      return NextResponse.json({ error: "Failed to delete plan" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete plan error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
