// API Route: Payment Webhook Handler
// POST /api/payment/webhook
// Receives and processes payment gateway webhooks

import { type NextRequest, NextResponse } from "next/server"
import { paymentService } from "@/services/payment/payment-service"
import type { KashierWebhookPayload } from "@/services/payment/kashier-adapter"
import { rateLimiter } from "@/services/payment/rate-limiter"
import { auditLogger } from "@/services/payment/audit-logger"

const getClientIp = (request: NextRequest) =>
  request.headers.get("x-real-ip") ||
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  ""

export async function POST(request: NextRequest) {
  try {
    const ipAddress = getClientIp(request)
    const userAgent = request.headers.get("user-agent") || undefined

    const rateCheck = await rateLimiter.checkRateLimit("ip", ipAddress || "unknown")
    if (!rateCheck.allowed) {
      await auditLogger.logSecurityEvent({
        eventType: "kashier_webhook_rate_limited",
        description: "Webhook blocked due to rate limiting",
        actor: "system",
        ipAddress,
        details: {
          identifierType: "ip",
          identifierValue: ipAddress || "unknown",
          resetAt: rateCheck.resetAt?.toISOString?.() ?? rateCheck.resetAt,
        },
      })
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

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

    let payload: KashierWebhookPayload
    try {
      payload = JSON.parse(rawBody)
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    // Delegate processing to service
    const result = await paymentService.handleKashierWebhook(
      payload,
      rawBody,
      signature,
      timestamp,
      { ipAddress, userAgent }
    )

    return NextResponse.json({ message: result.message }, { status: result.statusCode })

  } catch (error) {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

// GET method for testing webhook endpoint
export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    message: "Kashier webhook endpoint is active",
    timestamp: new Date().toISOString()
  })
}
