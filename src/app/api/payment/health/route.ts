// API Route: Payment System Health Check
// GET /api/payment/health

import { NextResponse } from "next/server"
import { paymentMonitoring } from "@/services/payment/monitoring"

export async function GET() {
  try {
    const health = await paymentMonitoring.healthCheck()

    const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 503 : 500

    return NextResponse.json(health, { status: statusCode })
  } catch (error: any) {
    console.error("[Health Check] Error:", error)
    return NextResponse.json(
      {
        status: "down",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
