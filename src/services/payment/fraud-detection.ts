// Fraud Detection and Risk Assessment System
// Implements comprehensive fraud prevention rules

import { createAdminClient } from "@/lib/supabase/admin"

export interface RiskAssessmentParams {
  orderId: string
  amount: number
  customerEmail: string
  customerId?: string
  ipAddress: string
  userAgent: string
  shippingAddress?: any
  billingAddress?: any
}

export interface RiskAssessmentResult {
  score: number // 0-100
  level: "low" | "medium" | "high" | "critical"
  flags: string[]
  blocked: boolean
  reasons: string[]
}

export class RiskAssessment {
  private supabase = createAdminClient()

  /**
   * Assess payment risk
   */
  async assessPayment(params: RiskAssessmentParams): Promise<RiskAssessmentResult> {
    let score = 0
    const flags: string[] = []
    const reasons: string[] = []

    // Run all risk checks
    score += await this.checkVelocity(params, flags, reasons)
    score += await this.checkAmount(params, flags, reasons)
    score += await this.checkLocation(params, flags, reasons)
    score += await this.checkDevice(params, flags, reasons)
    score += await this.checkPattern(params, flags, reasons)
    score += await this.checkFailureHistory(params, flags, reasons)

    // Determine risk level
    const level = this.calculateRiskLevel(score)
    const blocked = level === "critical" || score >= 80

    // Log security event if high risk
    if (level === "high" || level === "critical") {
      await this.logSecurityEvent({
        eventType: "high_risk_transaction",
        severity: level,
        description: `High risk payment detected: ${reasons.join(", ")}`,
        details: {
          orderId: params.orderId,
          score,
          flags,
          reasons,
        },
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      })
    }

    return {
      score: Math.min(score, 100),
      level,
      flags,
      blocked,
      reasons,
    }
  }

  /**
   * Check velocity (frequency of transactions)
   */
  private async checkVelocity(params: RiskAssessmentParams, flags: string[], reasons: string[]): Promise<number> {
    let score = 0

    try {
      // Check payment attempts from same IP in last 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

      const { data: recentAttempts } = await this.supabase
        .from("payment_transactions")
        .select("id")
        .eq("ip_address", params.ipAddress)
        .gte("created_at", tenMinutesAgo)

      if (recentAttempts && recentAttempts.length > 5) {
        score += 30
        flags.push("high_velocity_ip")
        reasons.push(`${recentAttempts.length} payment attempts from same IP in 10 minutes`)
      } else if (recentAttempts && recentAttempts.length > 3) {
        score += 15
        flags.push("moderate_velocity_ip")
        reasons.push(`${recentAttempts.length} payment attempts from same IP`)
      }

      // Check orders from same customer in last hour
      if (params.customerId) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

        const { data: recentOrders } = await this.supabase
          .from("orders")
          .select("id")
          .eq("customer_id", params.customerId)
          .gte("created_at", oneHourAgo)

        if (recentOrders && recentOrders.length > 3) {
          score += 20
          flags.push("high_velocity_customer")
          reasons.push(`${recentOrders.length} orders in last hour`)
        }
      }
    } catch (error) {
      console.error("[Risk Assessment] Velocity check error:", error)
    }

    return score
  }

  /**
   * Check transaction amount
   */
  private async checkAmount(params: RiskAssessmentParams, flags: string[], reasons: string[]): Promise<number> {
    let score = 0

    // Very high amount
    if (params.amount > 10000) {
      score += 25
      flags.push("very_high_amount")
      reasons.push(`Unusually high amount: ${params.amount} MAD`)
    } else if (params.amount > 5000) {
      score += 15
      flags.push("high_amount")
      reasons.push(`High amount: ${params.amount} MAD`)
    }

    // Very low amount (potential testing)
    if (params.amount < 10) {
      score += 10
      flags.push("very_low_amount")
      reasons.push(`Suspiciously low amount: ${params.amount} MAD`)
    }

    // Check if amount is significantly different from customer's average
    if (params.customerId) {
      try {
          const { data: avgOrder } = await this.supabase
            .from("orders")
            .select("total")
            .eq("customer_id", params.customerId)
            .eq("payment_status", "paid")

          // avgOrder items may be typed as unknown/never by generated types; treat as any here
          if (avgOrder && (avgOrder as any[]).length > 0) {
            const average = (avgOrder as any[]).reduce((sum: number, o: any) => sum + Number(o.total), 0) / (avgOrder as any[]).length

            if (params.amount > average * 3) {
              score += 15
              flags.push("amount_deviation")
              reasons.push(`Amount 3x higher than customer average`)
            }
          }
      } catch (error) {
        console.error("[Risk Assessment] Amount check error:", error)
      }
    }

    return score
  }

  /**
   * Check location/IP address
   */
  private async checkLocation(params: RiskAssessmentParams, flags: string[], reasons: string[]): Promise<number> {
    let score = 0

    try {
      // Check if IP is in rate limit table (previously flagged)
      const { data: rateLimit } = await this.supabase
        .from("payment_rate_limits")
        .select("*")
        .eq("identifier_type", "ip")
        .eq("identifier_value", params.ipAddress)
        .eq("is_blocked", true)
        .single()

      if (rateLimit) {
        score += 40
        flags.push("blocked_ip")
        reasons.push("IP address is blocked")
      }

      // Check for VPN/Proxy indicators (basic check)
      if (params.ipAddress.includes("10.") || params.ipAddress.includes("192.168.") || params.ipAddress === "unknown") {
        score += 10
        flags.push("suspicious_ip")
        reasons.push("Suspicious IP address")
      }
    } catch (error) {
      console.error("[Risk Assessment] Location check error:", error)
    }

    return score
  }

  /**
   * Check device/user agent
   */
  private async checkDevice(params: RiskAssessmentParams, flags: string[], reasons: string[]): Promise<number> {
    let score = 0

    // Check for suspicious user agents
    if (
      params.userAgent === "unknown" ||
      params.userAgent.includes("bot") ||
      params.userAgent.includes("curl") ||
      params.userAgent.includes("wget")
    ) {
      score += 20
      flags.push("suspicious_user_agent")
      reasons.push("Suspicious user agent detected")
    }

    // Check if this is a new device for high-value transaction
    if (params.customerId && params.amount > 1000) {
      try {
        const { data: previousOrders } = await this.supabase
          .from("payment_transactions")
          .select("user_agent")
          .eq("user_agent", params.userAgent)
          .limit(1)

        if (!previousOrders || previousOrders.length === 0) {
          score += 15
          flags.push("new_device_high_value")
          reasons.push("First transaction from this device with high amount")
        }
      } catch (error) {
        console.error("[Risk Assessment] Device check error:", error)
      }
    }

    return score
  }

  /**
   * Check for suspicious patterns
   */
  private async checkPattern(params: RiskAssessmentParams, flags: string[], reasons: string[]): Promise<number> {
    let score = 0

    try {
      // Check for email pattern (disposable email domains)
      const disposableDomains = ["tempmail.com", "guerrillamail.com", "10minutemail.com", "throwaway.email"]
      const emailDomain = params.customerEmail.split("@")[1]?.toLowerCase()

      if (disposableDomains.includes(emailDomain)) {
        score += 25
        flags.push("disposable_email")
        reasons.push("Disposable email address detected")
      }

      // Check for multiple accounts with same email pattern
      const emailPrefix = params.customerEmail.split("@")[0]
      const { data: similarEmails } = await this.supabase
        .from("customers")
        .select("id")
        .ilike("email", `${emailPrefix}%`)

      if (similarEmails && similarEmails.length > 3) {
        score += 15
        flags.push("email_pattern_abuse")
        reasons.push("Multiple accounts with similar email pattern")
      }
    } catch (error) {
      console.error("[Risk Assessment] Pattern check error:", error)
    }

    return score
  }

  /**
   * Check payment failure history
   */
  private async checkFailureHistory(params: RiskAssessmentParams, flags: string[], reasons: string[]): Promise<number> {
    let score = 0

    try {
      // Check recent failed payments from same IP
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

      const { data: failedPayments } = await this.supabase
        .from("payment_transactions")
        .select("id")
        .eq("ip_address", params.ipAddress)
        .eq("status", "failed")
        .gte("created_at", thirtyMinutesAgo)

      if (failedPayments && failedPayments.length > 3) {
        score += 30
        flags.push("multiple_failures")
        reasons.push(`${failedPayments.length} failed payment attempts`)
      } else if (failedPayments && failedPayments.length > 1) {
        score += 15
        flags.push("some_failures")
        reasons.push(`${failedPayments.length} recent failed payments`)
      }
    } catch (error) {
      console.error("[Risk Assessment] Failure history check error:", error)
    }

    return score
  }

  /**
   * Calculate risk level from score
   */
  private calculateRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
    if (score >= 80) return "critical"
    if (score >= 50) return "high"
    if (score >= 25) return "medium"
    return "low"
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(event: {
    eventType: string
    severity: string
    description: string
    details: any
    ipAddress: string
    userAgent: string
  }): Promise<void> {
    try {
      await this.supabase.from("security_events").insert({
        event_type: event.eventType,
        severity: event.severity,
        description: event.description,
        details: event.details,
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        status: "open",
      } as any)
    } catch (error) {
      console.error("[Risk Assessment] Failed to log security event:", error)
    }
  }

  /**
   * Apply fraud rules from database
   */
  async applyFraudRules(params: RiskAssessmentParams): Promise<{
    blocked: boolean
    triggeredRules: any[]
  }> {
    try {
      const { data: rules } = await this.supabase
        .from("fraud_rules")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: true })

      if (!rules) return { blocked: false, triggeredRules: [] }

      // coerce rules to any[] to avoid overly-strict generated types (which may be `never`)
      const rulesList: any[] = (rules as any) || []
      const triggeredRules: any[] = []

      for (const rule of rulesList) {
        const triggered = await this.evaluateRule(rule, params)

        if (triggered) {
          triggeredRules.push(rule)

          if ((rule as any).action === "block") {
            return { blocked: true, triggeredRules }
          }
        }
      }

      return { blocked: false, triggeredRules }
    } catch (error) {
      console.error("[Risk Assessment] Error applying fraud rules:", error)
      return { blocked: false, triggeredRules: [] }
    }
  }

  /**
   * Evaluate individual fraud rule
   */
  private async evaluateRule(rule: any, params: RiskAssessmentParams): Promise<boolean> {
    const conditions = rule.conditions

    switch (rule.rule_type) {
      case "velocity":
        return await this.evaluateVelocityRule(conditions, params)

      case "amount":
        return this.evaluateAmountRule(conditions, params)

      case "location":
        return this.evaluateLocationRule(conditions, params)

      default:
        return false
    }
  }

  private async evaluateVelocityRule(conditions: any, params: RiskAssessmentParams): Promise<boolean> {
    const { max_attempts, time_window_minutes, scope } = conditions
    const windowStart = new Date(Date.now() - time_window_minutes * 60 * 1000).toISOString()

    let query = this.supabase.from("payment_transactions").select("id").gte("created_at", windowStart)

    if (scope === "ip_address") {
      query = query.eq("ip_address", params.ipAddress)
    } else if (scope === "customer_id" && params.customerId) {
      query = query.eq("customer_id", params.customerId)
    }

    const { data } = await query
    return (data?.length || 0) >= max_attempts
  }

  private evaluateAmountRule(conditions: any, params: RiskAssessmentParams): boolean {
    const { threshold, operator } = conditions

    if (operator === "greater_than") {
      return params.amount > threshold
    } else if (operator === "less_than") {
      return params.amount < threshold
    }

    return false
  }

  private evaluateLocationRule(conditions: any, params: RiskAssessmentParams): boolean {
    const { blocked_countries } = conditions

    // In production, you would use a GeoIP service to get country from IP
    // For now, this is a placeholder
    return false
  }
}

// Export singleton instance
export const riskAssessment = new RiskAssessment()
