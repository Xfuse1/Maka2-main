import crypto from "crypto";
import { getKashierConfig } from "./kashier-config";

export interface KashierPaymentParams {
  orderId: string;
  amount: number;
  currency?: string;
  customerEmail: string;
  customerName: string;
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

export function buildKashierPaymentUrl(
  params: KashierPaymentParams
): KashierPaymentResult {
  const config = getKashierConfig();

  const orderId = params.orderId;
  const formattedAmount = Number(params.amount).toFixed(2);
  const currency = (params.currency || "EGP").toUpperCase();

  // IMPORTANT:
  // Use API KEY for signing (this matches the old working implementation).
  // apiSecret can be kept for webhooks, but not used here.
  const signingKey = config.apiKey;
  if (!signingKey) {
    throw new Error("No Kashier API key configured");
  }

  // This path format MUST match the original working code:
  const path = `/?payment=${config.merchantId}.${orderId}.${formattedAmount}.${currency}`;

  const hash = crypto
    .createHmac("sha256", signingKey)
    .update(path)
    .digest("hex");

  const successUrl = encodeURIComponent(
    `${config.appUrl}/order-success?orderId=${orderId}`
  );
  const failureUrl = encodeURIComponent(
    `${config.appUrl}/payment/cancel?orderId=${orderId}`
  );
  const webhookUrl = encodeURIComponent(
    `${config.appUrl}/api/payment/webhook`
  );

  const paymentUrl =
    `${config.baseUrl}/?merchantId=${config.merchantId}` +
    `&orderId=${orderId}` +
    `&mode=${config.mode}` +
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
  options?: { toleranceSeconds?: number }
): boolean {
  const config = getKashierConfig();
  const signingKey = config.apiSecret ?? config.apiKey;
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
