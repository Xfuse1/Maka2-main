import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

/**
 * POST /api/payment/subscription/webhook
 * Handle Kashier webhook for subscription payments
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[Subscription Webhook] Received:", JSON.stringify(body, null, 2))

    // Verify webhook signature if configured
    const webhookSecret = process.env.KASHIER_WEBHOOK_SECRET
    if (webhookSecret) {
      const signature = request.headers.get("x-kashier-signature")
      if (signature) {
        const expectedSignature = crypto
          .createHmac("sha256", webhookSecret)
          .update(JSON.stringify(body))
          .digest("hex")

        if (signature !== expectedSignature) {
          console.error("[Subscription Webhook] Invalid signature")
          return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
        }
      }
    }

    // Parse Kashier webhook payload
    const eventType = body.event_type || body.eventType || body.event
    const data = body.data || body

    // Extract transaction details
    const orderId = data.order_id || data.orderId || data.merchantOrderId
    const transactionId = data.transaction_id || data.transactionId || data.paymentId
    const status = data.status || data.paymentStatus
    const amount = data.amount

    console.log("[Subscription Webhook] Processing:", {
      eventType,
      orderId,
      transactionId,
      status,
      amount,
    })

    // Validate order ID format (SUB-{store_id}-{timestamp})
    if (!orderId || !orderId.startsWith("SUB-")) {
      console.log("[Subscription Webhook] Not a subscription payment, skipping")
      return NextResponse.json({ received: true, skipped: true })
    }

    // Create admin Supabase client
    const { createClient } = await import("@supabase/supabase-js")
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Handle different event types
    const isSuccess = 
      eventType === "payment.success" || 
      eventType === "CAPTURED" ||
      status === "SUCCESS" || 
      status === "CAPTURED" ||
      status === "success"

    const isFailed =
      eventType === "payment.failed" ||
      eventType === "FAILED" ||
      status === "FAILED" ||
      status === "failed"

    if (isSuccess) {
      console.log("[Subscription Webhook] Payment successful, activating subscription")

      // Find subscription with this payment reference
      const { data: subscription, error: subError } = await supabaseAdmin
        .from("subscriptions")
        .select("*, stores(id, subdomain)")
        .eq("payment_reference", orderId)
        .single()

      if (subError || !subscription) {
        console.error("[Subscription Webhook] Subscription not found for order:", orderId)
        
        // Try to find by parsing order ID
        // Format: SUB-{store_id_first_8_chars}-{timestamp}
        const parts = orderId.split("-")
        if (parts.length >= 2) {
          const storeIdPrefix = parts[1]
          
          // Find store with matching prefix
          const { data: stores } = await supabaseAdmin
            .from("stores")
            .select("id")
            .ilike("id", `${storeIdPrefix}%`)
            .limit(1)

          if (stores && stores.length > 0) {
            const storeId = stores[0].id

            // Find pending subscription for this store
            const { data: pendingSub } = await supabaseAdmin
              .from("subscriptions")
              .select("*")
              .eq("store_id", storeId)
              .eq("status", "pending")
              .order("created_at", { ascending: false })
              .limit(1)
              .single()

            if (pendingSub) {
              // Activate this subscription
              await activateSubscription(supabaseAdmin, pendingSub.id, storeId, orderId, transactionId, amount)
              return NextResponse.json({ success: true, activated: true })
            }
          }
        }

        return NextResponse.json({ received: true, error: "Subscription not found" })
      }

      // Activate the subscription
      await activateSubscription(
        supabaseAdmin,
        subscription.id,
        subscription.store_id,
        orderId,
        transactionId,
        amount
      )

      return NextResponse.json({ success: true, activated: true })
    }

    if (isFailed) {
      console.log("[Subscription Webhook] Payment failed")

      // Update subscription status to failed
      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("payment_reference", orderId)

      return NextResponse.json({ success: true, status: "failed" })
    }

    // Unknown event, just acknowledge
    console.log("[Subscription Webhook] Unknown event type:", eventType)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Subscription Webhook] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Activate a subscription and update store status
 */
async function activateSubscription(
  supabase: any,
  subscriptionId: string,
  storeId: string,
  orderId: string,
  transactionId: string,
  amount: number
) {
  const now = new Date()

  // Get subscription to calculate end date
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*, plan:subscription_plans(duration_days)")
    .eq("id", subscriptionId)
    .single()

  const durationDays = subscription?.plan?.duration_days || 30
  const endDate = new Date(now)
  endDate.setDate(endDate.getDate() + durationDays)

  // Update subscription
  await supabase
    .from("subscriptions")
    .update({
      status: "active",
      start_date: now.toISOString(),
      end_date: endDate.toISOString(),
      payment_reference: orderId,
      payment_method: "kashier",
      amount_paid: amount || subscription?.plan?.price || 0,
      updated_at: now.toISOString(),
    })
    .eq("id", subscriptionId)

  // Update store status to active
  await supabase
    .from("stores")
    .update({
      status: "active",
      subscription_status: "active",
      current_subscription_id: subscriptionId,
      updated_at: now.toISOString(),
    })
    .eq("id", storeId)

  console.log("[Subscription Webhook] Subscription activated:", {
    subscriptionId,
    storeId,
    endDate: endDate.toISOString(),
  })
}

// Handle GET for testing
export async function GET() {
  return NextResponse.json({
    status: "Subscription webhook endpoint active",
    timestamp: new Date().toISOString(),
  })
}
