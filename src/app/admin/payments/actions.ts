"use server"

// Server Actions for Admin Payment Dashboard

import { createAdminClient } from "@/lib/supabase/admin"
import { rateLimiter } from "@/services/payment/rate-limiter"
import type { FraudRule, SecurityEvent, PaymentTransaction } from "@/lib/supabase/payment-types"

export async function getPaymentTransactions(filters?: {
  status?: string
  riskLevel?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
}) {
  try {
    const supabase = createAdminClient()

    let query = supabase
      .from("payment_transactions")
      .select(
        `
        *,
        payment_methods(name, code),
        orders(order_number, customer_name, customer_email)
      `,
      )
      .order("created_at", { ascending: false })

    if (filters?.status) {
      query = query.eq("status", filters.status)
    }

    if (filters?.riskLevel) {
      query = query.eq("risk_level", filters.riskLevel)
    }

    if (filters?.dateFrom) {
      query = query.gte("created_at", filters.dateFrom)
    }

    if (filters?.dateTo) {
      query = query.lte("created_at", filters.dateTo)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    } else {
      query = query.limit(100)
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error("[Admin] Error fetching transactions:", error)
    return { success: false, error: error.message }
  }
}

export async function getSecurityEvents(filters?: { severity?: string; status?: string; limit?: number }) {
  try {
    const supabase = createAdminClient()

    let query = supabase.from("security_events").select("*").order("created_at", { ascending: false })

    if (filters?.severity) {
      query = query.eq("severity", filters.severity)
    }

    if (filters?.status) {
      query = query.eq("status", filters.status)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    } else {
      query = query.limit(50)
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error("[Admin] Error fetching security events:", error)
    return { success: false, error: error.message }
  }
}

export async function getFraudRules() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase.from("fraud_rules").select("*").order("priority", { ascending: true })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error("[Admin] Error fetching fraud rules:", error)
    return { success: false, error: error.message }
  }
}

export async function updateFraudRule(ruleId: string, updates: { is_active?: boolean; priority?: number }) {
  try {
    const supabase = createAdminClient()

    // @ts-ignore - Payment tables not in generated types yet
    const { error } = await supabase.from("fraud_rules").update(updates as any).eq("id", ruleId)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error("[Admin] Error updating fraud rule:", error)
    return { success: false, error: error.message }
  }
}

export async function getPaymentStats() {
  try {
    const supabase = createAdminClient()

    // Get transaction counts by status
    const { data: statusCounts } = await supabase.from("payment_transactions").select("status") as { data: PaymentTransaction[] | null }

    // Get risk level distribution
    const { data: riskCounts } = await supabase.from("payment_transactions").select("risk_level") as { data: PaymentTransaction[] | null }

    // Get total amounts
    const { data: amounts } = await supabase.from("payment_transactions").select("amount, status") as { data: PaymentTransaction[] | null }

    // Get recent security events
    const { data: recentEvents } = await supabase
      .from("security_events")
      .select("severity")
      .eq("status", "open")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) as { data: SecurityEvent[] | null }

    const stats = {
      totalTransactions: statusCounts?.length || 0,
      completedTransactions: statusCounts?.filter((t) => t.status === "completed").length || 0,
      pendingTransactions: statusCounts?.filter((t) => t.status === "pending").length || 0,
      failedTransactions: statusCounts?.filter((t) => t.status === "failed").length || 0,
      highRiskTransactions:
        riskCounts?.filter((t) => t.risk_level === "high" || t.risk_level === "critical").length || 0,
      totalAmount:
        amounts
          ?.filter((a) => a.status === "completed")
          .reduce((sum, a) => sum + Number(a.amount), 0)
          .toFixed(2) || "0.00",
      openSecurityEvents: recentEvents?.length || 0,
      criticalEvents: recentEvents?.filter((e) => e.severity === "critical").length || 0,
    }

    return { success: true, data: stats }
  } catch (error: any) {
    console.error("[Admin] Error fetching payment stats:", error)
    return { success: false, error: error.message }
  }
}   

export async function resolveSecurityEvent(eventId: string, resolution: string) {
  try {
    const supabase = createAdminClient()

    // @ts-ignore - Payment tables not in generated types yet
    const { error } = await supabase
      .from("security_events")
      // @ts-ignore
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolution_notes: resolution,
      })
      .eq("id", eventId)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error("[Admin] Error resolving security event:", error)
    return { success: false, error: error.message }
  }
}

export async function blockIpAddress(ipAddress: string, durationMinutes?: number) {
  try {
    await rateLimiter.blockIdentifier("ip", ipAddress, durationMinutes)
    return { success: true }
  } catch (error: any) {
    console.error("[Admin] Error blocking IP:", error)
    return { success: false, error: error.message }
  }
}

export async function unblockIpAddress(ipAddress: string) {
  try {
    await rateLimiter.unblockIdentifier("ip", ipAddress)
    return { success: true }
  } catch (error: any) {
    console.error("[Admin] Error unblocking IP:", error)
    return { success: false, error: error.message }
  }
}

export async function getPaymentLogs(transactionId: string) {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("payment_logs")
      .select("*")
      .eq("transaction_id", transactionId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error("[Admin] Error fetching payment logs:", error)
    return { success: false, error: error.message }
  }
}
