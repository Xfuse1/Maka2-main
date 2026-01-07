// Payment System Monitoring
// Real-time monitoring and health checks

import { createAdminClient } from "@/lib/supabase/admin"
import { alertingSystem } from "./alerting"

export interface SystemHealth {
  status: "healthy" | "degraded" | "down"
  checks: {
    database: boolean
    paymentGateway: boolean
    encryption: boolean
    rateLimit: boolean
  }
  metrics: {
    totalTransactions24h: number
    successRate: number
    averageProcessingTime: number
    activeSecurityEvents: number
  }
  timestamp: string
}

export class PaymentMonitoring {
  private supabase = createAdminClient()

  /**
   * Perform health check
   */
  async healthCheck(): Promise<SystemHealth> {
    const checks = {
      database: await this.checkDatabase(),
      paymentGateway: await this.checkPaymentGateway(),
      encryption: await this.checkEncryption(),
      rateLimit: await this.checkRateLimit(),
    }

    const metrics = await this.getMetrics()

    const allHealthy = Object.values(checks).every((check) => check === true)
    const someUnhealthy = Object.values(checks).some((check) => check === false)

    let status: "healthy" | "degraded" | "down" = "healthy"
    if (!allHealthy && someUnhealthy) {
      status = "degraded"
    }
    if (Object.values(checks).filter((c) => !c).length > 2) {
      status = "down"
    }

    // Alert if system is degraded or down
    if (status !== "healthy") {
      await alertingSystem.alertSystemError({
        component: "payment_system",
        error: `System status: ${status}`,
        details: { checks, metrics },
      })
    }

    return {
      status,
      checks,
      metrics,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Check database connectivity
   */
  private async checkDatabase(): Promise<boolean> {
    try {
      const { error } = await this.supabase.from("payment_methods").select("id").limit(1)
      return !error
    } catch {
      return false
    }
  }

  /**
   * Check payment gateway connectivity
   */
  private async checkPaymentGateway(): Promise<boolean> {
    try {
      // In production, ping the payment gateway API
      // For now, just check if credentials are configured
      return !!(process.env.CASHIER_API_KEY && process.env.CASHIER_API_SECRET)
    } catch {
      return false
    }
  }

  /**
   * Check encryption system
   */
  private async checkEncryption(): Promise<boolean> {
    try {
      return !!(process.env.PAYMENT_ENCRYPTION_KEY && process.env.PAYMENT_SIGNATURE_SECRET)
    } catch {
      return false
    }
  }

  /**
   * Check rate limiting system
   */
  private async checkRateLimit(): Promise<boolean> {
    try {
      const { error } = await (this.supabase.from("payment_rate_limits") as any).select("id").limit(1)
      return !error
    } catch {
      return false
    }
  }

  /**
   * Get system metrics
   */
  private async getMetrics(): Promise<SystemHealth["metrics"]> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Get transactions in last 24 hours
    const { data: transactions } = await (this.supabase
      .from("payment_transactions") as any)
      .select("status, created_at, completed_at")
      .gte("created_at", twentyFourHoursAgo)

    const totalTransactions24h = transactions?.length || 0
    const completedTransactions = transactions?.filter((t: any) => t.status === "completed").length || 0
    const successRate = totalTransactions24h > 0 ? (completedTransactions / totalTransactions24h) * 100 : 0

    // Calculate average processing time
    const processingTimes = transactions
      ?.filter((t: any) => t.completed_at)
      .map((t: any) => {
        const created = new Date(t.created_at).getTime()
        const completed = new Date(t.completed_at).getTime()
        return completed - created
      })

    const averageProcessingTime =
      processingTimes && processingTimes.length > 0
        ? processingTimes.reduce((sum: number, time: number) => sum + time, 0) / processingTimes.length / 1000
        : 0

    // Get active security events
    const { data: securityEvents } = await (this.supabase
      .from("security_events") as any)
      .select("id")
      .eq("status", "open")
      .gte("created_at", twentyFourHoursAgo)

    return {
      totalTransactions24h,
      successRate: Math.round(successRate * 100) / 100,
      averageProcessingTime: Math.round(averageProcessingTime * 100) / 100,
      activeSecurityEvents: securityEvents?.length || 0,
    }
  }

  /**
   * Monitor for anomalies
   */
  async detectAnomalies(): Promise<void> {
    const metrics = await this.getMetrics()

    // Alert on low success rate
    if (metrics.successRate < 80 && metrics.totalTransactions24h > 10) {
      await alertingSystem.sendAlert({
        type: "system",
        severity: "high",
        title: "معدل نجاح منخفض",
        message: `معدل نجاح المعاملات: ${metrics.successRate}%`,
        details: { metrics },
        timestamp: new Date().toISOString(),
      })
    }

    // Alert on high processing time
    if (metrics.averageProcessingTime > 30) {
      await alertingSystem.sendAlert({
        type: "system",
        severity: "medium",
        title: "وقت معالجة مرتفع",
        message: `متوسط وقت المعالجة: ${metrics.averageProcessingTime} ثانية`,
        details: { metrics },
        timestamp: new Date().toISOString(),
      })
    }

    // Alert on many active security events
    if (metrics.activeSecurityEvents > 20) {
      await alertingSystem.sendAlert({
        type: "security",
        severity: "high",
        title: "أحداث أمنية نشطة كثيرة",
        message: `${metrics.activeSecurityEvents} حدث أمني نشط`,
        details: { metrics },
        timestamp: new Date().toISOString(),
      })
    }
  }
}

// Export singleton instance
export const paymentMonitoring = new PaymentMonitoring()
