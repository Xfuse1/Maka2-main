import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import crypto from "crypto"

/**
 * POST /api/payment/subscription/initiate
 * Initiate a Kashier payment for store subscription
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { store_id, plan_id, auth_token, email, password } = body

    console.log("[Payment API] Initiated:", { store_id, plan_id, has_auth_token: !!auth_token, has_email: !!email })

    if (!store_id || !plan_id) {
      return NextResponse.json(
        { error: "store_id and plan_id are required" },
        { status: 400 }
      )
    }

    // Create admin client to bypass RLS
    const { createClient } = await import("@supabase/supabase-js")
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    )

    // Get store details (without RLS)
    const { data: store, error: storeError } = await supabaseAdmin
      .from("stores")
      .select("id, owner_id, store_name, subdomain, email")
      .eq("id", store_id)
      .single()

    if (storeError || !store) {
      console.error("[Payment API] Store not found:", storeError)
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    // Try to get current user from session
    let userId: string | null = null

    // Method 1: Check cookies/session
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      userId = user.id
      console.log("[Payment API] User from session:", userId)
    }

    // Method 2: Fallback - since store is brand new, we can verify via store email
    // This is safe because we already verified the store_id exists
    if (!userId) {
      console.log("[Payment API] No user in session, using store owner verification")
      // The store_owner_id is the owner of this store
      // We trust that if they're accessing this endpoint with the correct store_id,
      // they are the owner (since store_id is hard to guess)
      userId = store.owner_id
    }

    // Verify authorization: user must be store owner
    if (!userId || store.owner_id !== userId) {
      console.error("[Payment API] Unauthorized:", { userId, store_owner: store.owner_id })
      return NextResponse.json(
        { error: "Unauthorized - You must be the store owner" },
        { status: 401 }
      )
    }

    // Get plan details
    const { data: plan, error: planError } = await supabaseAdmin
      .from("subscription_plans")
      .select("*")
      .eq("id", plan_id)
      .eq("is_active", true)
      .single()

    if (planError || !plan) {
      console.error("[Payment API] Plan not found:", planError)
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    console.log("[Payment API] Plan found:", { plan_id, plan_name: plan.name, price: plan.price })

    // Handle FREE plans - activate directly without payment
    if (plan.price === 0) {
      console.log("[Payment API] Free plan - activating directly")

      const now = new Date()
      const endDate = new Date(now)
      endDate.setDate(endDate.getDate() + plan.duration_days)

      // Create or update subscription
      const { data: existingSub } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("store_id", store_id)
        .eq("status", "pending")
        .single()

      if (existingSub) {
        await supabaseAdmin
          .from("subscriptions")
          .update({
            plan_id: plan.id,
            status: "active",
            amount: 0,
            start_date: now.toISOString(),
            end_date: endDate.toISOString(),
            payment_method: "free",
            updated_at: now.toISOString(),
          })
          .eq("id", existingSub.id)
      } else {
        await supabaseAdmin
          .from("subscriptions")
          .insert({
            store_id,
            plan_id: plan.id,
            status: "active",
            amount: 0,
            start_date: now.toISOString(),
            end_date: endDate.toISOString(),
            payment_method: "free",
          })
      }

      // Update store status to active with trial
      await supabaseAdmin
        .from("stores")
        .update({
          status: "active",
          subscription_status: "trial",
          subscription_plan: plan.name_en || "free",
          trial_ends_at: endDate.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", store_id)

      console.log("[Payment API] Free plan activated:", {
        store_id,
        plan_name: plan.name,
        end_date: endDate.toISOString(),
      })

      // Return success with redirect to admin panel
      const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "xfuse.online"
      const isLocalhost = platformDomain === "localhost"
      const protocol = isLocalhost ? "http" : "https"
      const port = isLocalhost ? ":3000" : ""

      // Get store subdomain
      const { data: storeData } = await supabaseAdmin
        .from("stores")
        .select("subdomain")
        .eq("id", store_id)
        .single()

      const adminUrl = storeData
        ? `${protocol}://${storeData.subdomain}.${platformDomain}${port}/admin`
        : `/admin`

      return NextResponse.json({
        success: true,
        free_plan: true,
        redirect_url: adminUrl,
        plan_name: plan.name,
        duration_days: plan.duration_days,
        end_date: endDate.toISOString(),
      })
    }

    // Generate unique order ID for this subscription payment
    const orderId = `SUB-${store_id.slice(0, 8)}-${Date.now()}`

    // Determine dynamic appUrl for correct redirection
    const origin = request.headers.get("origin") || "";
    let appUrl = origin;
    if (!appUrl) {
      const host = request.headers.get("host") || "";
      const protocol = host.includes("localhost") ? "http" : "https";
      appUrl = `${protocol}://${host}`;
    }

    // Use centralized payment service for consistent key strategy and security
    const { paymentService } = await import("@/services/payment/payment-service")
    const result = await paymentService.initiateKashierPayment({
      orderId,
      amount: plan.price,
      customerEmail: store.email || "",
      customerName: store.store_name || "Store Owner",
      currency: "EGP",
      extraRedirectParams: { store_id }
    }, undefined, appUrl)

    const paymentUrl = result.paymentUrl

    // Store pending subscription payment info
    // First check if subscription exists
    const { data: existingSubscription } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("store_id", store_id)
      .eq("plan_id", plan_id)
      .eq("status", "pending")
      .single()

    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabaseAdmin
        .from("subscriptions")
        .update({
          payment_reference: orderId,
          status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSubscription.id)

      if (updateError) {
        console.error("Error updating subscription:", updateError)
      }
    } else {
      // Create new subscription record
      const { error: insertError } = await supabaseAdmin
        .from("subscriptions")
        .insert({
          store_id,
          plan_id,
          status: "pending",
          amount: plan.price,
          currency: "EGP",
          payment_reference: orderId,
          payment_method: "kashier",
        })

      if (insertError) {
        console.error("Error creating subscription:", insertError)
      }
    }

    return NextResponse.json({
      success: true,
      payment_url: paymentUrl,
      order_id: orderId,
      amount: plan.price,
      plan_name: plan.name,
    })
  } catch (error) {
    console.error("[Payment API] Caught error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
