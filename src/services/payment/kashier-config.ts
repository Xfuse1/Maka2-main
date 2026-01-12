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
  try {
    const parts = text.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = parts[1];
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
    const decipher = crypto.createDecipheriv(ALGORITHM, new Uint8Array(key), new Uint8Array(iv));
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return "";
  }
}

/**
 * Get Kashier config dynamically based on current store
 * Falls back to environment variables if database settings not found
 */
export async function getKashierConfigForStore(storeId: string): Promise<KashierConfig> {
  const supabase = createAdminClient();

  try {
    // Try to get settings from database first
    const { data, error } = await supabase
      .from("store_settings")
      .select("kashier_merchant_id, kashier_api_key, kashier_test_mode, kashier_webhook_secret, kashier_enabled")
      .eq("store_id", storeId)
      .single() as { data: any; error: any };

    if (!error && data && data.kashier_enabled) {
      const apiKey = data.kashier_api_key ? decrypt(data.kashier_api_key) : "";
      const webhookSecret = data.kashier_webhook_secret ? decrypt(data.kashier_webhook_secret) : "";

      if (data.kashier_merchant_id && apiKey) {
        const mode: KashierMode = data.kashier_test_mode ? "test" : "live";
        const baseUrl = "https://payments.kashier.io";
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        return {
          merchantId: data.kashier_merchant_id,
          apiKey,
          apiSecret: webhookSecret || apiKey, // Use webhook secret or fallback to API key
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
  const merchantId = process.env.KASHIER_MERCHANT_ID;
  const apiKey = process.env.KASHIER_API_KEY;
  const apiSecret = process.env.KASHIER_API_SECRET;
  
  const baseUrl =
    process.env.KASHIER_PAYMENT_URL ||
    process.env.KASHIER_BASE_URL ||
    "https://payments.kashier.io";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const modeEnv = (process.env.KASHIER_MODE || "test").toLowerCase();
  const mode: KashierMode = modeEnv === "live" ? "live" : "test";

  if (!merchantId) {
    throw new Error("KASHIER_MERCHANT_ID is not set in environment variables");
  }

  if (!apiKey) {
    throw new Error("KASHIER_API_KEY is not set in environment variables");
  }

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set");
  }

  return {
    merchantId,
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
