# Kashier Payment Integration Flow

## Overview
This project integrates with **Kashier Payment Gateway** to accept online payments (Credit Cards, Wallets).
The integration uses the **Redirect Method** (Hosted Checkout), where the user is redirected to a secure Kashier page to complete the payment.

## Create Payment Flow

1.  **User** clicks "Place Order" on the Checkout page.
2.  **Frontend** calls `POST /api/payment/create` with order details.
3.  **API Route** calls `paymentService.initiateKashierPayment`.
4.  **Service** calls `kashierAdapter.buildKashierPaymentUrl`.
5.  **Adapter** reads environment variables (via `kashier-config.ts`) and constructs a signed URL using HMAC SHA256.
6.  **API Route** returns `{ success: true, paymentUrl: "..." }`.
7.  **Frontend** redirects the browser to `paymentUrl`.

## Webhook Flow (Payment Status Updates)

1.  **Kashier** sends a `POST` request to `/api/payment/webhook` upon transaction status change.
2.  **API Route** reads the raw body and signature headers (`x-cashier-signature`).
3.  **API Route** delegates to `paymentService.handleKashierWebhook`.
4.  **Service** calls `kashierAdapter.verifyKashierWebhookSignature` to validate authenticity using the Secret Key.
5.  **Service** updates the database:
    *   Logs the webhook event in `payment_webhooks`.
    *   Updates `payment_transactions` status.
    *   Updates `orders` status (e.g. marking as "paid").

## Environment Variables

| Variable | Description | Example |
| :--- | :--- | :--- |
| `KASHIER_MERCHANT_ID` | Your Merchant ID from Kashier Dashboard | `MID-12345-678` |
| `KASHIER_API_KEY` | Used for hashing the payment request URL | `abcdef123456...` |
| `CASHIER_API_SECRET` | Used for verifying webhook signatures | `uvwxyz789012...` |
| `KASHIER_PAYMENT_URL` | Base URL for the payment gateway | `https://payments.kashier.io` |
| `NEXT_PUBLIC_APP_URL` | Your app's base URL (for callbacks) | `https://makastore.com` |

## Where to Modify Code

*   **URL Logic / Hashing:** Edit `src/services/payment/kashier-adapter.ts`.
*   **Environment Config:** Edit `src/services/payment/kashier-config.ts`.
*   **Business Logic / DB Updates:** Edit `src/services/payment/payment-service.ts`.
*   **API Contract:** Edit `src/app/api/payment/create/route.ts` or `src/app/api/payment/webhook/route.ts`.

## Legacy Notes
Previous implementations using `cashier-client.ts` have been deprecated and removed in favor of the `kashier-adapter` + `payment-service` architecture.
