import { type NextRequest, NextResponse } from "next/server"
import { paymentService } from "@/services/payment/payment-service"
import { auditLogger } from "@/services/payment/audit-logger"

const getClientIp = (request: NextRequest) =>
  request.headers.get("x-real-ip") ||
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  ""

/**
 * Optimized Subscription Webhook Handler
 * Delegates all logic to PaymentService for consistent performance and security
 */
export async function POST(request: NextRequest) {
  try {
    const ipAddress = getClientIp(request)
    const userAgent = request.headers.get("user-agent") || undefined

    const rawBody = await request.text()

    // Get webhook signature headers
    const signature =
      request.headers.get("x-kashier-signature") ||
      request.headers.get("x-cashier-signature") ||
      ""
    const timestamp =
      request.headers.get("x-kashier-timestamp") ||
      request.headers.get("x-cashier-timestamp") ||
      ""

    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    // Delegate processing to service (Shared logic for all Kashier webhooks)
    const result = await paymentService.handleKashierWebhook(
      payload,
      rawBody,
      signature,
      timestamp,
      { ipAddress, userAgent }
    )

    return NextResponse.json({ message: result.message }, { status: result.statusCode })

  } catch (error: any) {
    console.error("[Subscription Webhook] Internal error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed", details: error.message },
      { status: 500 }
    )
  }
}

// GET method for testing
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Subscription webhook is active",
    timestamp: new Date().toISOString()
  })
}
