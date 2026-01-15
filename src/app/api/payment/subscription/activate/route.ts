import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * POST /api/payment/subscription/activate
 * Activates a subscription directly when Kashier returns paymentStatus=SUCCESS
 * This is a fallback for when webhook doesn't arrive in time
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { store_id, orderId, transactionId } = body

        console.log("[Subscription Activate] Request:", { store_id, orderId, transactionId })

        if (!store_id || !orderId) {
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
            .select("*, plan:subscription_plans(duration_days, price, name_en)")
            .eq("store_id", store_id)
            .eq("payment_reference", orderId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

        if (subError) {
            console.error("[Subscription Activate] Subscription not found:", subError)
            return NextResponse.json(
                { error: "Subscription not found", details: subError.message },
                { status: 404 }
            )
        }

        // Check if already activated
        if (subscription.status === "active") {
            console.log("[Subscription Activate] Already active")

            // Get store info
            const { data: storeData } = await supabaseAdmin
                .from("stores")
                .select("store_name, subdomain")
                .eq("id", store_id)
                .single()

            return NextResponse.json({
                success: true,
                message: "Subscription already active",
                store: storeData
            })
        }

        // Activate subscription
        const now = new Date()
        const durationDays = subscription.plan?.duration_days || 30
        const endDate = new Date(now)
        endDate.setDate(endDate.getDate() + durationDays)

        console.log("[Subscription Activate] Activating subscription:", {
            subscription_id: subscription.id,
            duration_days: durationDays,
            end_date: endDate.toISOString()
        })

        // 1. Update subscription status
        const { error: updateError } = await supabaseAdmin
            .from("subscriptions")
            .update({
                status: "active",
                start_date: now.toISOString(),
                end_date: endDate.toISOString(),
                payment_method: "kashier",
                updated_at: now.toISOString(),
            })
            .eq("id", subscription.id)

        if (updateError) {
            console.error("[Subscription Activate] Error updating subscription:", updateError)
            return NextResponse.json(
                { error: "Failed to update subscription", details: updateError.message },
                { status: 500 }
            )
        }

        // 2. Update store status
        const { error: storeError } = await supabaseAdmin
            .from("stores")
            .update({
                status: "active",
                subscription_status: "active",
                subscription_plan: subscription.plan?.name_en || "pro",
                current_subscription_id: subscription.id,
                updated_at: now.toISOString(),
            })
            .eq("id", store_id)

        if (storeError) {
            console.error("[Subscription Activate] Error updating store:", storeError)
            // Continue anyway, subscription is already active
        }

        // Get store info for response
        const { data: storeData } = await supabaseAdmin
            .from("stores")
            .select("store_name, subdomain")
            .eq("id", store_id)
            .single()

        console.log("[Subscription Activate] Success:", {
            subscription_id: subscription.id,
            store: storeData
        })

        return NextResponse.json({
            success: true,
            message: "Subscription activated successfully",
            store: storeData,
            subscription: {
                id: subscription.id,
                status: "active",
                end_date: endDate.toISOString()
            }
        })

    } catch (error) {
        console.error("[Subscription Activate] Unexpected error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
