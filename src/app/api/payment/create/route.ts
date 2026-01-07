import { type NextRequest, NextResponse } from "next/server"
import { paymentService } from "@/services/payment/payment-service"
import type { KashierPaymentParams } from "@/services/payment/kashier-adapter"
import { rateLimiter } from "@/services/payment/rate-limiter"
import { auditLogger } from "@/services/payment/audit-logger"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

const isDev = process.env.NODE_ENV === "development"

const getClientIp = (request: NextRequest) =>
  request.headers.get("x-real-ip") ||
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  ""

export async function POST(request: NextRequest) {
  try {
    const ipAddress = getClientIp(request)

    const rateCheck = await rateLimiter.checkRateLimit("ip", ipAddress || "unknown")
    if (!rateCheck.allowed) {
      await auditLogger.logSecurityEvent({
        eventType: "payment_rate_limit_block",
        description: "Payment creation blocked due to rate limit",
        actor: "system",
        ipAddress,
        details: {
          identifierType: "ip",
          identifierValue: ipAddress || "unknown",
          resetAt: rateCheck.resetAt?.toISOString?.() ?? rateCheck.resetAt,
        },
      })

      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 },
      )
    }

    const body = await request.json()

    if (isDev) console.log("[Payment API] Request body")

    const {
      orderId,
      currency = "EGP",
      paymentMethod,
      customerEmail,
      customerName,
      customerPhone,
    } = body

    if (!orderId || !paymentMethod || !customerEmail || !customerName) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      )
    }

    // SECURITY: Verify order exists and get actual amount from database
    const supabaseAdmin = getSupabaseAdminClient() as any
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, total, user_id, customer_email, payment_status")
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      await auditLogger.logSecurityEvent({
        eventType: "payment_invalid_order",
        description: "Payment creation attempted for non-existent order",
        actor: customerEmail || "unknown",
        ipAddress,
        details: { orderId },
      })
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      )
    }

    // SECURITY: Check if order is already paid
    if (order.payment_status === "paid") {
      await auditLogger.logSecurityEvent({
        eventType: "payment_duplicate_attempt",
        description: "Payment creation attempted for already paid order",
        actor: customerEmail || "unknown",
        ipAddress,
        details: { orderId, orderNumber: order.order_number },
      })
      return NextResponse.json(
        { success: false, error: "Order has already been paid" },
        { status: 400 }
      )
    }

    // SECURITY: Verify order ownership
    // Get authenticated user if any
    let currentUser = null
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      currentUser = user
    } catch (e) {
      // User not authenticated - will rely on email check
    }

    // Verify ownership: either user_id matches OR customer_email matches
    const isOwner =
      (currentUser && order.user_id === currentUser.id) ||
      (order.customer_email && order.customer_email.toLowerCase() === customerEmail.toLowerCase())

    if (!isOwner) {
      await auditLogger.logSecurityEvent({
        eventType: "payment_unauthorized_access",
        description: "Payment creation attempted for order belonging to another user",
        actor: customerEmail || "unknown",
        ipAddress,
        details: { orderId, orderUserId: order.user_id, orderEmail: order.customer_email },
      })
      return NextResponse.json(
        { success: false, error: "Unauthorized: Order does not belong to you" },
        { status: 403 }
      )
    }

    // Use the actual order amount from database (not client-provided)
    const amount = order.total

    if (paymentMethod === "cod") {
      return NextResponse.json({
        success: true,
        transactionId: `cod_${Date.now()}`,
        message: "Cash on delivery order created",
      })
    }

    if (paymentMethod === "cashier") {
      try {
        const customerRateCheck = await rateLimiter.checkRateLimit("customer", String(customerEmail).toLowerCase())
        if (!customerRateCheck.allowed) {
          await auditLogger.logSecurityEvent({
            eventType: "payment_rate_limit_block",
            description: "Customer rate limit exceeded for Kashier payment creation",
            actor: "system",
            ipAddress,
            details: {
              identifierType: "customer",
              identifierValue: customerEmail,
              resetAt: customerRateCheck.resetAt?.toISOString?.() ?? customerRateCheck.resetAt,
            },
          })

          return NextResponse.json(
            { success: false, error: "Too many payment attempts. Please wait before retrying." },
            { status: 429 },
          )
        }

        // Map request body to service params
        const kashierParams: KashierPaymentParams = {
          orderId,
          amount: Number(amount),
          currency,
          customerEmail,
          customerName,
        }

        // Call the service to generate payment URL using the new adapter
        const result = await paymentService.initiateKashierPayment(kashierParams)

        await auditLogger.logPaymentCreated({
          transactionId: result.transactionId,
          orderId,
          amount: Number(amount),
          paymentMethod: "cashier",
          actor: customerEmail || "guest",
          ipAddress,
        })

        return NextResponse.json({
          success: true,
          paymentUrl: result.paymentUrl,
          transactionId: result.transactionId,
          message: "Kashier payment URL generated successfully",
        })

      } catch (error: any) {
        console.error("[Payment API] Kashier error:", error)
        
        if (isDev) {
          // Only fallback in dev if Kashier completely fails (e.g. missing config)
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          return NextResponse.json({
            success: true,
            paymentUrl: `${appUrl}/order-success?orderNumber=${orderId}&amount=${amount}&test=true&payment=fallback&error=kashier-failed`,
            transactionId: `fallback_${Date.now()}`,
            message: "Kashier failed - using development fallback",
          })
        }
        
        return NextResponse.json(
          {
            success: false,
            error: error.message || "Failed to generate Kashier payment URL",
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: `Unsupported payment method: ${paymentMethod}` },
      { status: 400 }
    )

  } catch (error: any) {
    console.error("[Payment API] Internal error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Payment API is running",
  })
}
