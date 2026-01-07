// Audit Logging System for Compliance
// Comprehensive logging for PCI DSS and regulatory compliance

import { createAdminClient } from "@/lib/supabase/admin"

export interface AuditLogEntry {
  action: string
  actor: string
  actorType: "system" | "admin" | "customer" | "api"
  resource: string
  resourceId: string
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
  severity: "info" | "warning" | "error" | "critical"
}

export class AuditLogger {
  private supabase = createAdminClient()

  /**
   * Log audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Log to payment_logs table
      await (this.supabase.from("payment_logs") as any).insert({
        event_type: entry.action,
        message: `${entry.actor} performed ${entry.action} on ${entry.resource}`,
        details: {
          ...entry.details,
          actor: entry.actor,
          actorType: entry.actorType,
          resource: entry.resource,
          resourceId: entry.resourceId,
          severity: entry.severity,
        },
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
      })

      // Log critical events to security_events
      if (entry.severity === "critical" || entry.severity === "error") {
        await (this.supabase.from("security_events") as any).insert({
          event_type: entry.action,
          severity: entry.severity,
          description: `${entry.actor} performed ${entry.action} on ${entry.resource}`,
          details: entry.details,
          ip_address: entry.ipAddress,
          user_agent: entry.userAgent,
          status: "open",
        })
      }
    } catch (error) {
      console.error("[Audit Logger] Failed to log event:", error)
      // Don't throw - logging failures shouldn't break the application
    }
  }

  /**
   * Log payment creation
   */
  async logPaymentCreated(params: {
    transactionId: string
    orderId: string
    amount: number
    paymentMethod: string
    actor: string
    ipAddress?: string
  }): Promise<void> {
    await this.log({
      action: "payment_created",
      actor: params.actor,
      actorType: "customer",
      resource: "payment_transaction",
      resourceId: params.transactionId,
      details: {
        orderId: params.orderId,
        amount: params.amount,
        paymentMethod: params.paymentMethod,
      },
      ipAddress: params.ipAddress,
      severity: "info",
    })
  }

  /**
   * Log payment status change
   */
  async logPaymentStatusChange(params: {
    transactionId: string
    oldStatus: string
    newStatus: string
    actor: string
    reason?: string
  }): Promise<void> {
    await this.log({
      action: "payment_status_changed",
      actor: params.actor,
      actorType: "system",
      resource: "payment_transaction",
      resourceId: params.transactionId,
      details: {
        oldStatus: params.oldStatus,
        newStatus: params.newStatus,
        reason: params.reason,
      },
      severity: params.newStatus === "failed" ? "warning" : "info",
    })
  }

  /**
   * Log refund request
   */
  async logRefundRequested(params: {
    transactionId: string
    refundAmount: number
    reason: string
    actor: string
  }): Promise<void> {
    await this.log({
      action: "refund_requested",
      actor: params.actor,
      actorType: "admin",
      resource: "payment_refund",
      resourceId: params.transactionId,
      details: {
        refundAmount: params.refundAmount,
        reason: params.reason,
      },
      severity: "warning",
    })
  }

  /**
   * Log security event
   */
  async logSecurityEvent(params: {
    eventType: string
    description: string
    actor: string
    ipAddress?: string
    details?: Record<string, any>
  }): Promise<void> {
    await this.log({
      action: params.eventType,
      actor: params.actor,
      actorType: "system",
      resource: "security",
      resourceId: "system",
      details: {
        description: params.description,
        ...params.details,
      },
      ipAddress: params.ipAddress,
      severity: "critical",
    })
  }

  /**
   * Log admin action
   */
  async logAdminAction(params: {
    action: string
    adminId: string
    resource: string
    resourceId: string
    details?: Record<string, any>
    ipAddress?: string
  }): Promise<void> {
    await this.log({
      action: params.action,
      actor: params.adminId,
      actorType: "admin",
      resource: params.resource,
      resourceId: params.resourceId,
      details: params.details || {},
      ipAddress: params.ipAddress,
      severity: "info",
    })
  }

  /**
   * Log data access (for PCI DSS compliance)
   */
  async logDataAccess(params: {
    actor: string
    dataType: string
    recordId: string
    action: "read" | "write" | "delete"
    ipAddress?: string
  }): Promise<void> {
    await this.log({
      action: `data_${params.action}`,
      actor: params.actor,
      actorType: "admin",
      resource: params.dataType,
      resourceId: params.recordId,
      details: {
        accessType: params.action,
      },
      ipAddress: params.ipAddress,
      severity: params.action === "delete" ? "warning" : "info",
    })
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger()
