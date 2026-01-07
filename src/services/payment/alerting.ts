// Alerting System for Payment Security
// Real-time alerts for critical security events

import { createAdminClient } from "@/lib/supabase/admin"

export interface Alert {
  type: "fraud" | "security" | "system" | "compliance"
  severity: "low" | "medium" | "high" | "critical"
  title: string
  message: string
  details: Record<string, any>
  timestamp: string
}

export class AlertingSystem {
  private supabase = createAdminClient()

  /**
   * Send alert
   */
  async sendAlert(alert: Alert): Promise<void> {
    try {
      // Log to security events
      await (this.supabase.from("security_events") as any).insert({
        event_type: `alert_${alert.type}`,
        severity: alert.severity,
        description: alert.title,
        details: {
          message: alert.message,
          ...alert.details,
        },
        status: "open",
      })

      // In production, you would also:
      // - Send email notifications
      // - Send SMS alerts for critical events
      // - Post to Slack/Discord webhooks
      // - Trigger PagerDuty incidents
      // - Log to external monitoring services (Sentry, DataDog, etc.)

      if (alert.severity === "critical") {
        await this.handleCriticalAlert(alert)
      }
    } catch (error) {
      console.error("[Alerting] Failed to send alert:", error)
    }
  }

  /**
   * Handle critical alerts
   */
  private async handleCriticalAlert(alert: Alert): Promise<void> {
    console.error(`[CRITICAL ALERT] ${alert.title}`)
    console.error(`[CRITICAL ALERT] ${alert.message}`)
    console.error(`[CRITICAL ALERT] Details:`, alert.details)

    // In production:
    // - Send immediate notifications to on-call team
    // - Create incident in incident management system
    // - Potentially trigger automated responses (e.g., block IPs)
  }

  /**
   * Alert on high-risk transaction
   */
  async alertHighRiskTransaction(params: {
    transactionId: string
    orderId: string
    riskScore: number
    riskLevel: string
    flags: string[]
  }): Promise<void> {
    await this.sendAlert({
      type: "fraud",
      severity: params.riskLevel === "critical" ? "critical" : "high",
      title: "معاملة عالية المخاطر",
      message: `تم اكتشاف معاملة عالية المخاطر (${params.riskScore}/100)`,
      details: {
        transactionId: params.transactionId,
        orderId: params.orderId,
        riskScore: params.riskScore,
        riskLevel: params.riskLevel,
        flags: params.flags,
      },
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Alert on multiple failed payments
   */
  async alertMultipleFailures(params: { ipAddress: string; failureCount: number; timeWindow: string }): Promise<void> {
    await this.sendAlert({
      type: "security",
      severity: "high",
      title: "محاولات دفع فاشلة متعددة",
      message: `${params.failureCount} محاولات دفع فاشلة من نفس IP في ${params.timeWindow}`,
      details: {
        ipAddress: params.ipAddress,
        failureCount: params.failureCount,
        timeWindow: params.timeWindow,
      },
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Alert on suspicious pattern
   */
  async alertSuspiciousPattern(params: { pattern: string; description: string; details: any }): Promise<void> {
    await this.sendAlert({
      type: "fraud",
      severity: "medium",
      title: "نمط مشبوه",
      message: params.description,
      details: {
        pattern: params.pattern,
        ...params.details,
      },
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Alert on system error
   */
  async alertSystemError(params: { component: string; error: string; details?: any }): Promise<void> {
    await this.sendAlert({
      type: "system",
      severity: "high",
      title: "خطأ في النظام",
      message: `خطأ في ${params.component}: ${params.error}`,
      details: {
        component: params.component,
        error: params.error,
        ...params.details,
      },
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Alert on compliance issue
   */
  async alertComplianceIssue(params: { issue: string; severity: "low" | "medium" | "high" }): Promise<void> {
    await this.sendAlert({
      type: "compliance",
      severity: params.severity,
      title: "مشكلة في الامتثال",
      message: params.issue,
      details: {},
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Get recent alerts
   */
  async getRecentAlerts(limit = 50): Promise<Alert[]> {
    try {
      const { data } = await (this.supabase
        .from("security_events") as any)
        .select("*")
        .like("event_type", "alert_%")
        .order("created_at", { ascending: false })
        .limit(limit)

      return (
        data?.map((event: any) => ({
          type: event.event_type.replace("alert_", "") as any,
          severity: event.severity,
          title: event.description,
          message: event.details?.message || "",
          details: event.details || {},
          timestamp: event.created_at,
        })) || []
      )
    } catch (error) {
      console.error("[Alerting] Failed to get recent alerts:", error)
      return []
    }
  }
}

// Export singleton instance
export const alertingSystem = new AlertingSystem()
