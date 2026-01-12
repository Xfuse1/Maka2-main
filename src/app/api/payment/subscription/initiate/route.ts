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
    const { store_id, plan_id } = body

    if (!store_id || !plan_id) {
      return NextResponse.json(
        { error: "store_id and plan_id are required" },
        { status: 400 }
      )
    }

    // Create Supabase client
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

    // Verify user is logged in
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    // Verify store belongs to user
    const { data: store, error: storeError } = await supabaseAdmin
      .from("stores")
      .select("id, owner_id, store_name, subdomain, email")
      .eq("id", store_id)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    if (store.owner_id !== user.id) {
      return NextResponse.json({ error: "Not authorized for this store" }, { status: 403 })
    }

    // Get plan details
    const { data: plan, error: planError } = await supabaseAdmin
      .from("subscription_plans")
      .select("*")
      .eq("id", plan_id)
      .eq("is_active", true)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    if (plan.price === 0) {
      return NextResponse.json(
        { error: "Cannot initiate payment for free plan" },
        { status: 400 }
      )
    }

    // Generate unique order ID for this subscription payment
    const orderId = `SUB-${store_id.slice(0, 8)}-${Date.now()}`

    // Get Kashier config from environment (platform-level payment for subscriptions)
    const merchantId = process.env.KASHIER_MERCHANT_ID
    const apiKey = process.env.KASHIER_API_KEY
    const mode = process.env.KASHIER_TEST_MODE === "true" ? "test" : "live"
    const baseUrl = "https://checkout.kashier.io"
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.NEXT_PUBLIC_PLATFORM_DOMAIN}`

    if (!merchantId || !apiKey) {
      console.error("Kashier configuration missing")
      return NextResponse.json(
        { error: "Payment configuration error" },
        { status: 500 }
      )
    }

    const amount = plan.price
    const formattedAmount = Number(amount).toFixed(2)
    const currency = "EGP"

    // Generate hash for Kashier
    const path = `/?payment=${merchantId}.${orderId}.${formattedAmount}.${currency}`
    const hash = crypto
      .createHmac("sha256", apiKey)
      .update(path)
      .digest("hex")

    // Build URLs
    const successUrl = encodeURIComponent(
      `${appUrl}/subscription/success?orderId=${orderId}&store_id=${store_id}`
    )
    const failureUrl = encodeURIComponent(
      `${appUrl}/subscription/cancel?orderId=${orderId}&store_id=${store_id}`
    )
    const webhookUrl = encodeURIComponent(
      `${appUrl}/api/payment/subscription/webhook`
    )

    // Build payment URL
    const paymentUrl =
      `${baseUrl}/?merchantId=${merchantId}` +
      `&orderId=${orderId}` +
      `&mode=${mode}` +
      `&amount=${formattedAmount}` +
      `&currency=${currency}` +
      `&hash=${hash}` +
      `&merchantRedirect=${successUrl}` +
      `&failureRedirect=${failureUrl}` +
      `&serverWebhook=${webhookUrl}` +
      `&display=ar` +
      `&allowedMethods=card,wallet`

    // Store pending subscription payment info
    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        payment_reference: orderId,
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("store_id", store_id)
      .eq("plan_id", plan_id)
      .eq("status", "pending")

    if (updateError) {
      console.error("Error updating subscription:", updateError)
    }

    return NextResponse.json({
      success: true,
      payment_url: paymentUrl,
      order_id: orderId,
      amount: plan.price,
      plan_name: plan.name,
    })
  } catch (error) {
    console.error("Payment initiation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
