import crypto from "crypto";
import { getKashierConfigFromEnv, type KashierConfig } from "./kashier-config";

export interface KashierPaymentParams {
  orderId: string;
  amount: number;
  currency?: string;
  customerEmail: string;
  customerName: string;
  storeId?: string; // NEW: Store ID for multi-tenant support
}

export interface KashierPaymentResult {
  paymentUrl: string;
  transactionId: string;
}

export interface KashierWebhookPayload {
  event_type: string;
  data: {
    transaction_id: string;
    order_id: string;
    amount?: number;
    currency?: string;
    status?: string;
    failure_reason?: string;
    refund_amount?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Build Kashier payment URL with provided config
 * This allows passing store-specific config instead of using global env vars
 */
export function buildKashierPaymentUrl(
  params: KashierPaymentParams,
  config?: KashierConfig
): KashierPaymentResult {
  // Use provided config or fallback to environment variables
  const kashierConfig = config || getKashierConfigFromEnv();

  const orderId = params.orderId;
  const formattedAmount = Number(params.amount).toFixed(2);
  const currency = (params.currency || "EGP").toUpperCase();

  // Use API KEY for signing
  const signingKey = kashierConfig.apiKey;
  if (!signingKey) {
    throw new Error("No Kashier API key configured");
  }

  // Path format for hash generation
  const path = `/?payment=${kashierConfig.merchantId}.${orderId}.${formattedAmount}.${currency}`;

  const hash = crypto
    .createHmac("sha256", signingKey)
    .update(path)
    .digest("hex");

  const successUrl = encodeURIComponent(
    `${kashierConfig.appUrl}/order-success?orderId=${orderId}`
  );
  const failureUrl = encodeURIComponent(
    `${kashierConfig.appUrl}/payment/cancel?orderId=${orderId}`
  );
  const webhookUrl = encodeURIComponent(
    `${kashierConfig.appUrl}/api/payment/webhook`
  );

  const paymentUrl =
    `${kashierConfig.baseUrl}/?merchantId=${kashierConfig.merchantId}` +
    `&orderId=${orderId}` +
    `&mode=${kashierConfig.mode}` +
    `&amount=${formattedAmount}` +
    `&currency=${currency}` +
    `&hash=${hash}` +
    `&merchantRedirect=${successUrl}` +
    `&failureRedirect=${failureUrl}` +
    `&serverWebhook=${webhookUrl}` +
    `&allowedMethods=card,wallet,bank_installments&display=en`;

  return {
    paymentUrl,
    transactionId: `kashier_${orderId}`,
  };
}

export function verifyKashierWebhookSignature(
  rawBody: string,
  signature: string,
  timestamp: string,
  config?: KashierConfig,
  options?: { toleranceSeconds?: number }
): boolean {
  // Use provided config or fallback to environment variables
  const kashierConfig = config || getKashierConfigFromEnv();
  const signingKey = kashierConfig.apiSecret ?? kashierConfig.apiKey;
  if (!signingKey) {
    console.error("[KashierAdapter] No signing key configured");
    return false;
  }

  if (!signature || !timestamp) {
    console.error("[KashierAdapter] Missing signature headers");
    return false;
  }

  const toleranceMs = (options?.toleranceSeconds ?? 300) * 1000;
  const parsedTimestamp = Number(timestamp);
  const timestampMs = Number.isFinite(parsedTimestamp)
    ? (parsedTimestamp > 1e12 ? parsedTimestamp : parsedTimestamp * 1000)
    : Date.parse(timestamp);

  if (!Number.isFinite(timestampMs)) {
    console.error("[KashierAdapter] Invalid webhook timestamp");
    return false;
  }

  if (Math.abs(Date.now() - timestampMs) > toleranceMs) {
    console.error("[KashierAdapter] Webhook timestamp outside allowed window");
    return false;
  }

  const message = `${timestamp}.${rawBody}`;

  try {
    const expectedSignature = crypto
      .createHmac("sha256", signingKey)
      .update(message)
      .digest("hex");

    const sigBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      new Uint8Array(sigBuffer),
      new Uint8Array(expectedBuffer)
    );
  } catch (err) {
    console.error("[KashierAdapter] Error verifying signature:", err);
    return false;
  }
}
