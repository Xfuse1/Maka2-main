// Rate Limiting System for Payment Attempts
// Prevents brute force and abuse

import { createAdminClient } from "@/lib/supabase/admin"

export interface RateLimitCheck {
  allowed: boolean
  remaining: number
  resetAt: Date
  blocked: boolean
}

export class RateLimiter {
  private supabase = createAdminClient()

  // Rate limit configurations (Increased for testing)
  private readonly limits = {
    ip: { maxAttempts: 100, windowMinutes: 10 },
    customer: { maxAttempts: 100, windowMinutes: 60 },
    card: { maxAttempts: 50, windowMinutes: 30 },
  }

  /**
   * Check if request is rate limited
   */
  async checkRateLimit(identifierType: "ip" | "customer" | "card", identifierValue: string): Promise<RateLimitCheck> {
    // TEMPORARILY DISABLED FOR TESTING
    console.log("[Rate Limiter] Rate limiting disabled for testing");
    return {
      allowed: true,
      remaining: 100,
      resetAt: new Date(),
      blocked: false,
    };
  }

  /**
   * Reset rate limit for identifier
   */
  async resetRateLimit(identifierType: string, identifierValue: string): Promise<void> {
    try {
      await (this.supabase
        .from("payment_rate_limits") as any)
        .update({
          attempt_count: 1,
          window_start: new Date().toISOString(),
          window_end: new Date().toISOString(),
          is_blocked: false,
          blocked_until: null,
        })
        .eq("identifier_type", identifierType)
        .eq("identifier_value", identifierValue)
    } catch (error) {
      console.error("[Rate Limiter] Error resetting rate limit:", error)
    }
  }

  /**
   * Block identifier permanently or temporarily
   */
  async blockIdentifier(identifierType: string, identifierValue: string, durationMinutes?: number): Promise<void> {
    try {
      const blockedUntil = durationMinutes ? new Date(Date.now() + durationMinutes * 60 * 1000).toISOString() : null

      await (this.supabase.from("payment_rate_limits") as any).upsert({
        identifier_type: identifierType,
        identifier_value: identifierValue,
        is_blocked: true,
        blocked_until: blockedUntil,
        attempt_count: 999,
      })
    } catch (error) {
      console.error("[Rate Limiter] Error blocking identifier:", error)
    }
  }

  /**
   * Unblock identifier
   */
  async unblockIdentifier(identifierType: string, identifierValue: string): Promise<void> {
    try {
      await (this.supabase
        .from("payment_rate_limits") as any)
        .update({
          is_blocked: false,
          blocked_until: null,
        })
        .eq("identifier_type", identifierType)
        .eq("identifier_value", identifierValue)
    } catch (error) {
      console.error("[Rate Limiter] Error unblocking identifier:", error)
    }
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter()
