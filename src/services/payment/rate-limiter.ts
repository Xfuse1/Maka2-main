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

  // Rate limit configurations
  private readonly limits = {
    ip: { maxAttempts: 10, windowMinutes: 10 },
    customer: { maxAttempts: 5, windowMinutes: 60 },
    card: { maxAttempts: 3, windowMinutes: 30 },
  }

  /**
   * Check if request is rate limited
   */
  async checkRateLimit(identifierType: "ip" | "customer" | "card", identifierValue: string): Promise<RateLimitCheck> {
    try {
      const config = this.limits[identifierType]
      const now = new Date()
      const windowStart = new Date(now.getTime() - config.windowMinutes * 60 * 1000)

      // Get or create rate limit record
      const { data: existing } = await (this.supabase
        .from("payment_rate_limits") as any)
        .select("*")
        .eq("identifier_type", identifierType)
        .eq("identifier_value", identifierValue)
        .single()

      if (!existing) {
        // First attempt - create record
        await (this.supabase.from("payment_rate_limits") as any).insert({
          identifier_type: identifierType,
          identifier_value: identifierValue,
          attempt_count: 1,
          window_start: windowStart.toISOString(),
          window_end: now.toISOString(),
          is_blocked: false,
        })

        return {
          allowed: true,
          remaining: config.maxAttempts - 1,
          resetAt: new Date(now.getTime() + config.windowMinutes * 60 * 1000),
          blocked: false,
        }
      }

      // Check if currently blocked
      if (existing.is_blocked && existing.blocked_until) {
        const blockedUntil = new Date(existing.blocked_until)

        if (now < blockedUntil) {
          return {
            allowed: false,
            remaining: 0,
            resetAt: blockedUntil,
            blocked: true,
          }
        } else {
          // Unblock and reset
          await this.resetRateLimit(identifierType, identifierValue)
          return {
            allowed: true,
            remaining: config.maxAttempts - 1,
            resetAt: new Date(now.getTime() + config.windowMinutes * 60 * 1000),
            blocked: false,
          }
        }
      }

      // Check if window has expired
      const windowStartDate = new Date(existing.window_start)
      if (now.getTime() - windowStartDate.getTime() > config.windowMinutes * 60 * 1000) {
        // Reset window
        await this.resetRateLimit(identifierType, identifierValue)
        return {
          allowed: true,
          remaining: config.maxAttempts - 1,
          resetAt: new Date(now.getTime() + config.windowMinutes * 60 * 1000),
          blocked: false,
        }
      }

      // Increment attempt count
      const newCount = existing.attempt_count + 1
      const remaining = Math.max(0, config.maxAttempts - newCount)
      const allowed = newCount <= config.maxAttempts

      // Update record
      const updateData: any = {
        attempt_count: newCount,
        window_end: now.toISOString(),
      }

      // Block if limit exceeded
      if (!allowed) {
        updateData.is_blocked = true
        updateData.blocked_until = new Date(now.getTime() + config.windowMinutes * 60 * 1000).toISOString()
      }

      await (this.supabase
        .from("payment_rate_limits") as any)
        .update(updateData)
        .eq("identifier_type", identifierType)
        .eq("identifier_value", identifierValue)

      return {
        allowed,
        remaining,
        resetAt: new Date(now.getTime() + config.windowMinutes * 60 * 1000),
        blocked: !allowed,
      }
    } catch (error) {
      console.error("[Rate Limiter] Error checking rate limit:", error)
      // Fail open - allow request but log error
      return {
        allowed: true,
        remaining: 0,
        resetAt: new Date(),
        blocked: false,
      }
    }
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
