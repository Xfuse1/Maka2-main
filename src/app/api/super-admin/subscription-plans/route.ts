import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * GET /api/super-admin/subscription-plans
 * Fetch all subscription plans for super admin
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

    // Fetch all plans (including inactive for admin)
    const { data: plans, error } = await supabase
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

    // Validate required fields
    const { name, name_en, price, duration_days, features, is_active, is_default, sort_order } = body

    if (!name || !name_en || price === undefined || !duration_days) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // If this is default, unset other defaults
    if (is_default) {
      await supabase
        .from("subscription_plans")
        .update({ is_default: false })
        .eq("is_default", true)
    }

    // Create plan
    const { data: plan, error } = await supabase
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

    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Plan ID required" }, { status: 400 })
    }

    // If setting as default, unset other defaults
    if (updates.is_default) {
      await supabase
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

    // Update plan
    const { data: plan, error } = await supabase
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
    const cookieStore = await cookies()
    const { searchParams } = new URL(request.url)
    const planId = searchParams.get("id")
    
    if (!planId) {
      return NextResponse.json({ error: "Plan ID required" }, { status: 400 })
    }

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

    // Check if plan has active subscriptions
    const { count } = await supabase
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

    // Delete plan
    const { error } = await supabase
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
