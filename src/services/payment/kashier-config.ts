import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export type KashierMode = "test" | "live";

export interface KashierConfig {
  merchantId: string;
  apiKey: string;
  apiSecret?: string;
  baseUrl: string;
  appUrl: string;
  mode: KashierMode;
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "change-this-to-32-char-secret!!";
const ALGORITHM = "aes-256-cbc";

function decrypt(text: string): string {
  if (!text) return "";

  // If the text doesn't look encrypted (no colon separator), return as-is
  if (!text.includes(":")) {
    console.log("[KashierConfig] Key appears unencrypted, using raw value");
    return text;
  }

  try {
    const parts = text.split(":");
    if (parts.length !== 2) {
      console.log("[KashierConfig] Invalid encrypted format, using raw value");
      return text;
    }

    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = parts[1];
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
    const decipher = crypto.createDecipheriv(ALGORITHM, new Uint8Array(key), new Uint8Array(iv));
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    // Sanity check: Kashier API keys are typically 32-64 chars
    if (decrypted.length > 100) {
      console.warn("[KashierConfig] Decrypted key too long, might be double-encrypted. Using raw.");
      return text;
    }

    return decrypted;
  } catch (error) {
    console.error("[KashierConfig] Decryption error, using raw value:", error);
    return text; // Return raw value as fallback
  }
}

/**
 * Get Kashier config dynamically based on current store
 * Falls back to environment variables if database settings not found
 */
export async function getKashierConfigForStore(
  storeId: string,
  overrideAppUrl?: string
): Promise<KashierConfig> {
  const supabase = createAdminClient();

  try {
    // Try to get settings from database first
    const { data, error } = await supabase
      .from("store_settings")
      .select("kashier_merchant_id, kashier_api_key, kashier_test_mode, kashier_webhook_secret, kashier_enabled")
      .eq("store_id", storeId)
      .single() as { data: any; error: any };

    if (!error && data && data.kashier_enabled) {
      console.log("[KashierConfig] Raw API Key from DB length:", data.kashier_api_key?.length || 0);

      const apiKey = data.kashier_api_key ? decrypt(data.kashier_api_key) : "";
      const webhookSecret = data.kashier_webhook_secret ? decrypt(data.kashier_webhook_secret) : "";

      console.log("[KashierConfig] Decrypted API Key length:", apiKey?.length || 0);
      console.log("[KashierConfig] Decrypted API Key sample:", apiKey?.slice(0, 10) + "...");

      if (data.kashier_merchant_id && apiKey) {
        const mode: KashierMode = data.kashier_test_mode ? "test" : "live";
        const baseUrl = "https://checkout.kashier.io";
        const rawAppUrl = overrideAppUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const appUrl = (overrideAppUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

        // Ensure merchant ID starts with MID- for stores
        let merchantId = String(data.kashier_merchant_id).trim();
        if (merchantId && !merchantId.startsWith('MID-') && !merchantId.startsWith('mid-')) {
          merchantId = `MID-${merchantId}`;
        }

        return {
          merchantId: merchantId,
          apiKey: String(apiKey).trim(),
          apiSecret: String(webhookSecret || apiKey).trim(),
          baseUrl,
          appUrl,
          mode,
        };
      }
    }
  } catch (dbError) {
    console.error("[KashierConfig] Database error:", dbError);
  }

  // Fallback to environment variables (for backward compatibility)
  console.warn("[KashierConfig] Using environment variables fallback for store:", storeId);
  return getKashierConfigFromEnv();
}

/**
 * Legacy function - gets config from environment variables
 * Used as fallback when database settings not found
 */
export function getKashierConfigFromEnv(): KashierConfig {
  const apiKey = process.env.KASHIER_API_KEY;
  const apiSecret = process.env.KASHIER_API_SECRET;

  const modeEnv = (process.env.KASHIER_MODE || "test").toLowerCase();
  const mode: KashierMode = modeEnv === "live" ? "live" : "test";
  const baseUrl = "https://checkout.kashier.io";
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

  let mId = (process.env.KASHIER_MERCHANT_ID || "").trim();
  if (mId && !mId.startsWith('MID-') && !mId.startsWith('mid-')) {
    mId = `MID-${mId}`;
  }

  if (!mId) {
    throw new Error("KASHIER_MERCHANT_ID is not set in environment variables");
  }

  if (!apiKey) {
    throw new Error("KASHIER_API_KEY is not set in environment variables");
  }

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set");
  }

  return {
    merchantId: mId,
    apiKey,
    apiSecret,
    baseUrl,
    appUrl,
    mode,
  };
}

// For backward compatibility - remove this when all code is updated
export function getKashierConfig(): KashierConfig {
  console.warn("[KashierConfig] getKashierConfig() is deprecated. Use getKashierConfigForStore() instead.");
  return getKashierConfigFromEnv();
}

export async function getKashierSecretLean(storeIdOrPrefix: string): Promise<string> {
  const supabase = createAdminClient();

  try {
    const query = supabase
      .from("store_settings")
      .select("kashier_api_key, kashier_webhook_secret")

    // Support both full UUID and 8-char prefix
    if (storeIdOrPrefix.length === 8) {
      query.ilike("store_id", `${storeIdOrPrefix}%`)
    } else {
      query.eq("store_id", storeIdOrPrefix)
    }

    const { data, error } = await query.maybeSingle() as { data: any; error: any };

    if (error || !data) return "";

    const secret = data.kashier_webhook_secret || data.kashier_api_key;
    return secret ? decrypt(secret) : "";
  } catch (error) {
    console.error("[KashierConfig] Lean fetch error:", error);
    return "";
  }
}
