import { NextRequest, NextResponse } from "next/server"
import { trackServerEvent, AnalyticsEventPayload, AnalyticsEventName } from "@/lib/analytics/server-tracker"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventName, user, product, order, pageUrl, referrer, sessionId, rawPayload } = body

    if (!eventName) {
      return NextResponse.json({ success: false, error: "Missing eventName" }, { status: 400 })
    }

    // Map frontend payload to server tracker payload
    const payload: AnalyticsEventPayload = {
      userId: user?.id,
      userName: user?.name,
      pageUrl,
      referrer,
      sessionId,
      productId: product?.id,
      productName: product?.name,
      productPrice: product?.price,
      productCurrency: product?.currency,
      orderId: order?.id,
      orderTotal: order?.total,
      orderCurrency: order?.currency,
      rawPayload,
    }

    // Fire and forget (don't await if you want faster response, but awaiting ensures error logging)
    await trackServerEvent(eventName as AnalyticsEventName, payload)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Analytics API] Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
