// Payment Service - Core payment processing logic
// Handles payment creation, validation, and status updates

import { createAdminClient } from "@/lib/supabase/admin"
import { 
  buildKashierPaymentUrl, 
  verifyKashierWebhookSignature, 
  KashierPaymentParams, 
  KashierPaymentResult,
  KashierWebhookPayload 
} from "./kashier-adapter"
import { auditLogger } from "./audit-logger"
import { encryptPaymentData, generateSignature, generateSecureToken } from "./encryption"

export interface KashierWebhookResult {
  ok: boolean
  statusCode: number
  message: string
}

export interface CreatePaymentParams {
  orderId: string
  amount: number
  currency?: string
  paymentMethod: "cashier" | "cod" | "bank_transfer"
  customerEmail: string
  customerName: string
  customerPhone?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
}

export interface PaymentResult {
  success: boolean
  transactionId?: string
  paymentUrl?: string
  checkoutUrl?: string
  url?: string
  message?: string
  error?: string
  data?: any
}

export class PaymentService {
  private supabase = createAdminClient()

  /**
   * Initiate a new Kashier payment (Clean method)
   */
  async initiateKashierPayment(params: KashierPaymentParams): Promise<KashierPaymentResult> {
    // Basic validation
    if (!params.orderId || !params.amount) {
      throw new Error("Missing required payment parameters")
    }

    // Build URL using pure adapter logic
    const result = buildKashierPaymentUrl(params)

    // Save transaction to database
    try {
      const { error } = await this.supabase.from("payment_transactions").insert({
        order_id: params.orderId,
        transaction_id: result.transactionId,
        amount: params.amount,
        currency: params.currency || "EGP",
        status: "pending",
        payment_method_id: "kashier",
        initiated_at: new Date().toISOString(),
      } as any)

      if (error) {
        console.error("[PaymentService] Failed to save transaction:", error)
        // Don't throw - allow payment to continue even if DB save fails
      }
    } catch (dbError: any) {
      console.error("[PaymentService] Database error:", dbError)
      // Continue with payment even if DB fails
    }

    return result
  }

  /**
   * Handle Kashier Webhook
   * Verifies signature and processes the event
   */
  async handleKashierWebhook(
    payload: KashierWebhookPayload,
    rawBody: string,
    signature: string,
    timestamp: string,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<KashierWebhookResult> {
    const supabase = this.supabase as any

    if (!signature || !timestamp) {
      console.error("[PaymentService] Missing webhook signature headers")
      await auditLogger.logSecurityEvent({
        eventType: "kashier_webhook_missing_signature",
        description: "Webhook missing signature or timestamp header",
        actor: "kashier_webhook",
        ipAddress: context?.ipAddress,
        details: { hasSignature: Boolean(signature), hasTimestamp: Boolean(timestamp) },
      })
      return { ok: false, statusCode: 400, message: "Missing signature headers" }
    }

    // 1. Verify signature (with timestamp tolerance)
    const isValid = verifyKashierWebhookSignature(rawBody, signature, timestamp)
    if (!isValid) {
      console.error("[PaymentService] Invalid webhook signature")
      await auditLogger.logSecurityEvent({
        eventType: "kashier_webhook_invalid_signature",
        description: "Rejected Kashier webhook due to invalid signature",
        actor: "kashier_webhook",
        ipAddress: context?.ipAddress,
        details: { signature, timestamp },
      })
      return { ok: false, statusCode: 401, message: "Invalid signature" }
    }

    // Best-effort webhook logging for traceability
    try {
      await supabase.from("payment_webhooks").insert({
        source: "cashier",
        event_type: payload?.event_type,
        payload: payload as any,
        signature,
        signature_verified: true,
        status: "processing",
      } as any)
    } catch (e) {
      console.warn("[PaymentService] Failed to log webhook row", e)
    }

    const transactionId = payload?.data?.transaction_id
    const orderId = payload?.data?.order_id
    const payloadAmount = Number(payload?.data?.amount ?? NaN)
    const payloadCurrency = String(payload?.data?.currency || "").toUpperCase()

    if (!orderId) {
      await auditLogger.logSecurityEvent({
        eventType: "kashier_webhook_missing_order",
        description: "Webhook payload missing order_id",
        actor: "kashier_webhook",
        ipAddress: context?.ipAddress,
        details: { transactionId },
      })
      return { ok: false, statusCode: 400, message: "Missing order_id" }
    }

    try {
      // Validate order and transaction details
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("id, order_number, total, currency, payment_status, payment_method")
        .eq("id", orderId)
        .single()

      if (orderError || !order) {
        await auditLogger.logSecurityEvent({
          eventType: "kashier_webhook_order_not_found",
          description: "Received webhook for unknown order",
          actor: "kashier_webhook",
          ipAddress: context?.ipAddress,
          details: { orderId, transactionId },
        })
        return { ok: false, statusCode: 404, message: "Order not found" }
      }

      const normalizedMethod = String(order.payment_method || "").toLowerCase()
      if (normalizedMethod && !["cashier", "kashier"].includes(normalizedMethod)) {
        await auditLogger.logSecurityEvent({
          eventType: "kashier_webhook_payment_method_mismatch",
          description: "Webhook payment method does not match order",
          actor: "kashier_webhook",
          ipAddress: context?.ipAddress,
          details: { orderId, paymentMethod: order.payment_method },
        })
        return { ok: false, statusCode: 400, message: "Payment method mismatch" }
      }

      const expectedAmount = Number(order.total ?? 0)
      const amountMatches = Number.isFinite(payloadAmount) && Math.abs(payloadAmount - expectedAmount) < 0.01
      const expectedCurrency = (order.currency || "EGP").toUpperCase()
      const currencyMatches = (payloadCurrency || expectedCurrency) === expectedCurrency

      if (!amountMatches || !currencyMatches) {
        await auditLogger.logSecurityEvent({
          eventType: "kashier_webhook_amount_mismatch",
          description: "Webhook amount or currency did not match order",
          actor: "kashier_webhook",
          ipAddress: context?.ipAddress,
          details: {
            orderId,
            payloadAmount,
            expectedAmount,
            payloadCurrency: payloadCurrency || null,
            expectedCurrency,
          },
        })
        return { ok: false, statusCode: 400, message: "Payment details mismatch" }
      }

      const { data: txRows, error: txError } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)

      if (txError) {
        console.error("[PaymentService] Failed to read payment transaction:", txError)
      }

      const transaction = txRows?.[0]
      if (!transaction) {
        await auditLogger.logSecurityEvent({
          eventType: "kashier_webhook_transaction_not_found",
          description: "Webhook referenced order with no payment transaction",
          actor: "kashier_webhook",
          ipAddress: context?.ipAddress,
          details: { orderId, transactionId },
        })
        return { ok: false, statusCode: 404, message: "Payment transaction not found" }
      }

      const eventType = payload.event_type
      const nowIso = new Date().toISOString()

      switch (eventType) {
        case "payment.completed":
        case "payment.success": {
          const alreadyPaid = order.payment_status === "paid"

          const { error: txUpdateError } = await supabase
            .from("payment_transactions")
            .update({
              status: "completed",
              completed_at: nowIso,
              gateway_response: payload.data,
              updated_at: nowIso,
            })
            .eq("id", transaction.id)

          if (txUpdateError) {
            console.error("[PaymentService] Failed to update transaction:", txUpdateError)
            return { ok: false, statusCode: 500, message: "Failed to update transaction" }
          }

          if (!alreadyPaid) {
            const { error: orderUpdateError } = await supabase
              .from("orders")
              .update({
                payment_status: "paid",
                status: "processing",
                updated_at: nowIso,
              })
              .eq("id", orderId)

            if (orderUpdateError) {
              console.error("[PaymentService] Failed to update order:", orderUpdateError)
              return { ok: false, statusCode: 500, message: "Failed to update order" }
            }
          }

          await auditLogger.logPaymentStatusChange({
            transactionId: transaction.transaction_id || transaction.id,
            oldStatus: transaction.status || "pending",
            newStatus: "completed",
            actor: "kashier_webhook",
            reason: alreadyPaid ? "idempotent" : undefined,
          })

          return { ok: true, statusCode: 200, message: alreadyPaid ? "Already processed" : "Payment processed" }
        }

        case "payment.failed": {
          const { error: txFailError } = await supabase
            .from("payment_transactions")
            .update({
              status: "failed",
              failed_at: nowIso,
              gateway_response: payload.data,
              updated_at: nowIso,
            })
            .eq("id", transaction.id)

          if (txFailError) {
            console.error("[PaymentService] Failed to update transaction failure:", txFailError)
          }

          const { error: orderFailError } = await supabase
            .from("orders")
            .update({
              payment_status: "failed",
              updated_at: nowIso,
            })
            .eq("id", orderId)

          if (orderFailError) {
            console.error("[PaymentService] Failed to update order failure:", orderFailError)
          }

          await auditLogger.logPaymentStatusChange({
            transactionId: transaction.transaction_id || transaction.id,
            oldStatus: transaction.status || "pending",
            newStatus: "failed",
            actor: "kashier_webhook",
            reason: payload?.data?.failure_reason,
          })

          return { ok: true, statusCode: 200, message: "Failure recorded" }
        }

        case "payment.refunded": {
          await supabase.from("payment_refunds").insert({
            transaction_id: transactionId || transaction.transaction_id,
            refund_amount: payload.data.refund_amount,
            status: "completed",
            completed_at: nowIso,
          } as any)
          
          await supabase
            .from("payment_transactions")
            .update({
              status: "refunded",
              updated_at: nowIso,
            })
            .eq("id", transaction.id)

          await auditLogger.logPaymentStatusChange({
            transactionId: transaction.transaction_id || transaction.id,
            oldStatus: transaction.status || "pending",
            newStatus: "refunded",
            actor: "kashier_webhook",
          })

          return { ok: true, statusCode: 200, message: "Refund recorded" }
        }

        default:
          return { ok: true, statusCode: 200, message: "Event ignored" }
      }

    } catch (error: any) {
      console.error("[PaymentService] Error processing webhook:", error)
      return { ok: false, statusCode: 500, message: "Internal processing failed" }
    }
  }

  /**
   * Create a new payment transaction
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    try {
      // Validate required parameters
      if (!params.orderId || !params.amount || !params.paymentMethod) {
        return {
          success: false,
          error: "Missing required payment parameters",
        }
      }

      // Get payment method details with error handling
      let paymentMethod: any = null
      try {
        const { data, error } = await this.supabase
          .from("payment_methods")
          .select("*")
          .eq("code", params.paymentMethod)
          .eq("is_active", true)
          .single()

        if (error) {
          console.warn("[Payment Service] Payment method query error:", error.message)
        } else {
          paymentMethod = data
        }
      } catch (dbError: any) {
        console.warn("[Payment Service] Database error fetching payment method:", dbError.message)
      }

      // If payment method not found in DB, use default configuration
      if (!paymentMethod) {
        paymentMethod = {
          id: `default_${params.paymentMethod}`,
          code: params.paymentMethod,
          name: params.paymentMethod.toUpperCase(),
          is_active: true,
        }
      }

      // Handle different payment methods
      if (params.paymentMethod === "cashier") {
        throw new Error("Use initiateKashierPayment for Kashier payments")
      } else if (params.paymentMethod === "cod") {
        return await this.processCODPayment(params, paymentMethod)
      } else if (params.paymentMethod === "bank_transfer") {
        return await this.processBankTransferPayment(params, paymentMethod)
      }

      return {
        success: false,
        error: "Unsupported payment method",
      }
    } catch (error: any) {
      console.error("[Payment Service] Error creating payment:", error)
      // CRITICAL: Always return a PaymentResult object, never throw
      return {
        success: false,
        error: error?.message || "Payment creation failed",
      }
    }
  }


  /**
   * Process Cash on Delivery payment
   */
  private async processCODPayment(params: CreatePaymentParams, paymentMethod: any): Promise<PaymentResult> {
    try {
      const transactionId = `cod_${generateSecureToken(16)}`

      // Try to save to database (non-critical)
      try {
        const { data: transaction, error } = await this.supabase
          .from("payment_transactions")
          .insert({
            order_id: params.orderId,
            payment_method_id: paymentMethod.id,
            transaction_id: transactionId,
            amount: params.amount,
            currency: params.currency || "EGP",
            status: "pending",
            ip_address: params.ipAddress,
            user_agent: params.userAgent,
            initiated_at: new Date().toISOString(),
          } as any)
          .select()
          .single()

        if (error) {
          console.warn("[Payment Service] COD DB save error:", error)
        } else if (transaction) {
          await this.logPaymentEvent((transaction as any).id, "initiated", "COD payment created").catch((e) =>
            console.warn("[Payment Service] Log error:", e),
          )
        }
      } catch (dbError: any) {
        console.warn("[Payment Service] COD database error (continuing):", dbError.message)
      }

      return {
        success: true,
        transactionId,
        message: "Cash on delivery order created",
      }
    } catch (error: any) {
      console.error("[Payment Service] COD payment error:", error)
      return {
        success: false,
        error: error?.message || "COD payment failed",
      }
    }
  }

  /**
   * Process Bank Transfer payment
   */
  private async processBankTransferPayment(params: CreatePaymentParams, paymentMethod: any): Promise<PaymentResult> {
    try {
      const transactionId = `bank_${generateSecureToken(16)}`

      // Try to save to database (non-critical)
      try {
        const { data: transaction, error } = await this.supabase
          .from("payment_transactions")
          .insert({
            order_id: params.orderId,
            payment_method_id: paymentMethod.id,
            transaction_id: transactionId,
            amount: params.amount,
            currency: params.currency || "EGP",
            status: "pending",
            ip_address: params.ipAddress,
            user_agent: params.userAgent,
            initiated_at: new Date().toISOString(),
          } as any)
          .select()
          .single()

        if (error) {
          console.warn("[Payment Service] Bank transfer DB error:", error)
        } else if (transaction) {
          await this.logPaymentEvent((transaction as any).id, "initiated", "Bank transfer payment created").catch((e) =>
            console.warn("[Payment Service] Log error:", e),
          )
        }
      } catch (dbError: any) {
        console.warn("[Payment Service] Bank transfer DB error (continuing):", dbError.message)
      }

      return {
        success: true,
        transactionId,
        message: "Bank transfer instructions sent",
      }
    } catch (error: any) {
      console.error("[Payment Service] Bank transfer error:", error)
      return {
        success: false,
        error: error?.message || "Bank transfer payment failed",
      }
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    transactionId: string,
    status: "processing" | "completed" | "failed" | "cancelled",
    details?: any,
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      }

      if (status === "completed") {
        updateData.completed_at = new Date().toISOString()
      } else if (status === "failed") {
        updateData.failed_at = new Date().toISOString()
      }

      if (details) {
        updateData.gateway_response = details
      }

      const supabase = this.supabase as any
      const { error } = await supabase
        .from("payment_transactions")
        .update(updateData)
        .eq("id", transactionId)

      if (error) throw error

      await this.logPaymentEvent(transactionId, status, `Payment ${status}`, details).catch((e) =>
        console.warn("[Payment Service] Log error:", e),
      )

      return true
    } catch (error) {
      console.error("[Payment Service] Failed to update payment status:", error)
      return false
    }
  }

  /**
   * Log payment event
   */
  private async logPaymentEvent(
    transactionId: string,
    eventType: string,
    message: string,
    details?: any,
  ): Promise<void> {
    try {
      await this.supabase.from("payment_logs").insert({
        transaction_id: transactionId,
        event_type: eventType,
        message,
        details: details || {},
      } as any)
    } catch (error) {
      console.error("[Payment Service] Failed to log event:", error)
    }
  }

  /**
   * Get payment transaction
   */
  async getTransaction(transactionId: string) {
    try {
      const { data, error } = await this.supabase
        .from("payment_transactions")
        .select("*, payment_methods(*), orders(*)")
        .eq("id", transactionId)
        .single()

      if (error) {
        console.error("[Payment Service] Failed to get transaction:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("[Payment Service] Get transaction error:", error)
      return null
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService()
