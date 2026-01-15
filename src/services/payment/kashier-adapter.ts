import crypto from "crypto";
import { getKashierConfigFromEnv, type KashierConfig } from "./kashier-config";

export interface KashierPaymentParams {
  orderId: string;
  amount: number;
  currency?: string;
  customerEmail: string;
  customerName: string;
  storeId?: string;
  extraRedirectParams?: Record<string, string>; // NEW
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
  config?: KashierConfig,
  originalOrderId?: string
): KashierPaymentResult {
  // Use provided config or fallback to environment variables
  const kashierConfig = config || getKashierConfigFromEnv();

  // CRITICAL: Ensure orderId is under 50 characters for Kashier compatibility
  let orderId = params.orderId;
  if (orderId.length > 50) {
    console.warn(`[KashierAdapter] orderId too long (${orderId.length}), truncating`);
    orderId = orderId.slice(0, 50);
  }

  const displayOrderId = originalOrderId || orderId;
  const formattedAmount = Number(params.amount).toFixed(2);
  const currency = (params.currency || "EGP").toUpperCase();

  // CRITICAL: Use the EXACT same merchantId for hash and URL
  const merchantId = String(kashierConfig.merchantId).trim();
  let signingKey = String(kashierConfig.apiKey).trim();

  // Kashier keys with $ separator: try second part (after $) for signing
  if (signingKey.includes('$')) {
    const keyParts = signingKey.split('$');
    // Try the SECOND part this time (after $)
    console.log("[KashierAdapter] Key contains $, using SECOND part:", keyParts[1]?.length || 0, "chars");
    signingKey = keyParts[1] || keyParts[0];
  }

  if (!signingKey) {
    throw new Error("No Kashier API key configured for signing");
  }

  // HASH: Must match Kashier's expected format exactly
  // Format: /?payment=MID.ORDER.AMOUNT.CURRENCY
  const path = `/?payment=${merchantId}.${orderId}.${formattedAmount}.${currency}`;

  console.log("[KashierAdapter] Hash path:", path);
  console.log("[KashierAdapter] Signing key length:", signingKey.length);

  const hash = crypto
    .createHmac("sha256", signingKey)
    .update(path)
    .digest("hex");

  // Build redirect URLs
  let successUrlStr = `${kashierConfig.appUrl}/order-success?orderId=${displayOrderId}`;
  let failureUrlStr = `${kashierConfig.appUrl}/payment/cancel?orderId=${displayOrderId}`;

  if (params.extraRedirectParams) {
    const query = new URLSearchParams(params.extraRedirectParams).toString();
    if (query) {
      const isSub = orderId.startsWith('P-SUB-');
      const successPath = isSub ? '/subscription/success' : '/order-success';
      const failurePath = isSub ? '/subscription/cancel' : '/payment/cancel';

      successUrlStr = `${kashierConfig.appUrl}${successPath}?orderId=${displayOrderId}&${query}`;
      failureUrlStr = `${kashierConfig.appUrl}${failurePath}?orderId=${displayOrderId}&${query}`;
    }
  }

  const isSub = orderId.startsWith('P-SUB-');
  const webhookPath = isSub ? '/api/payment/subscription/webhook' : '/api/payment/webhook';

  const successUrl = encodeURIComponent(successUrlStr);
  const failureUrl = encodeURIComponent(failureUrlStr);
  const webhookUrl = encodeURIComponent(
    `${kashierConfig.appUrl}${webhookPath}`
  );

  // BUILD URL: Use the EXACT same merchantId used for hash
  const paymentUrl =
    `${kashierConfig.baseUrl}/?merchantId=${merchantId}` +
    `&orderId=${orderId}` +
    `&mode=${kashierConfig.mode}` +
    `&amount=${formattedAmount}` +
    `&currency=${currency}` +
    `&hash=${hash}` +
    `&merchantRedirect=${successUrl}` +
    `&failureRedirect=${failureUrl}` +
    `&serverWebhook=${webhookUrl}` +
    `&display=ar` +
    `&allowedMethods=card,wallet`;

  console.log("[KashierAdapter] Payment URL generated:", paymentUrl.slice(0, 200) + "...");

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
