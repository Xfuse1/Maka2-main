export type KashierMode = "test" | "live";

export interface KashierConfig {
  merchantId: string;
  apiKey: string;
  apiSecret?: string;
  baseUrl: string;
  appUrl: string;
  mode: KashierMode;
}

let cachedConfig: KashierConfig | null = null;

export function getKashierConfig(): KashierConfig {
  if (cachedConfig) return cachedConfig;

  const merchantId = process.env.KASHIER_MERCHANT_ID;
  const apiKey = process.env.KASHIER_API_KEY;
  const apiSecret = process.env.KASHIER_API_SECRET;
  
  // Prefer KASHIER_PAYMENT_URL, fall back to KASHIER_BASE_URL, then default
  const baseUrl =
    process.env.KASHIER_PAYMENT_URL ||
    process.env.KASHIER_BASE_URL ||
    "https://payments.kashier.io";

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const modeEnv = (process.env.KASHIER_MODE || "test").toLowerCase();
  const mode: KashierMode = modeEnv === "live" ? "live" : "test";

  if (!merchantId) {
    throw new Error("KASHIER_MERCHANT_ID is not set");
  }

  if (!apiKey) {
    throw new Error("KASHIER_API_KEY is not set");
  }

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set");
  }

  cachedConfig = {
    merchantId,
    apiKey,
    apiSecret,
    baseUrl,
    appUrl,
    mode,
  };

  return cachedConfig;
}
