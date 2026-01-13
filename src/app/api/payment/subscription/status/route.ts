import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * GET /api/payment/subscription/status?store_id=xxx&orderId=xxx
 * Check subscription payment status (bypasses RLS)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get("store_id")
    const orderId = searchParams.get("orderId")

    if (!storeId || !orderId) {
      return NextResponse.json(
        { error: "store_id and orderId are required" },
        { status: 400 }
      )
    }

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Find subscription with this payment reference
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("store_id", storeId)
      .eq("payment_reference", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (subError) {
      console.error("[Payment Status] Error:", subError)
      return NextResponse.json(
        { error: "Subscription not found", details: subError.message },
        { status: 404 }
      )
    }

    // Check if payment is confirmed (webhook updated it)
    const isPaymentConfirmed =
      subscription.status === "active" &&
      subscription.payment_reference === orderId &&
      subscription.payment_method === "kashier"

    // Get store info if payment confirmed
    let store = null
    if (isPaymentConfirmed) {
      const { data: storeData } = await supabaseAdmin
        .from("stores")
        .select("store_name, subdomain")
        .eq("id", storeId)
        .single()
      store = storeData
    }

    return NextResponse.json({
      success: true,
      subscription: {
        status: subscription.status,
        payment_reference: subscription.payment_reference,
        payment_method: subscription.payment_method,
      },
      isPaymentConfirmed,
      store,
    })
  } catch (error) {
    console.error("[Payment Status] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
