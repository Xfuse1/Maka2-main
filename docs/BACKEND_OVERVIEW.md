# Makastore Backend Overview

This document details the backend structure, focusing on API routes and the service layer.

## Core Technologies

- **Framework:** Next.js (App Router API Routes)
- **Database:** Supabase (PostgreSQL)
- **Payment Gateway:** Kashier

## API Route & Service Layer Interaction

The backend follows a service-oriented pattern. API routes in `src/app/api` are responsible for handling HTTP requests, validating data, and delegating the core business logic to service modules located in `src/services`.

### Payment API (`src/app/api/payment`)

This is the most critical backend area, handling all payment-related operations.

- **`/api/payment/create` (POST):**
  - Creates a new payment transaction.
  - Calls `paymentService.createPayment(...)` from `services/payment/payment-service.ts`.

- **`/api/payment/webhook` (POST):**
  - Receives webhook notifications from the payment gateway (Kashier).
  - Verifies the webhook signature using `cashierClient.verifyWebhookSignature(...)`.
  - Calls `paymentService.updatePaymentStatus(...)` to update the order status based on the webhook event (e.g., `payment.completed`, `payment.failed`).

- **`/api/payment/health` (GET):**
  - Provides a health check for the payment system.
  - Calls `paymentMonitoring.healthCheck()` from `services/payment/monitoring.ts`.

### Other Key Backend Areas

- **Authentication (`/api/auth`):** Handles user signup and login.
- **Orders (`/api/orders`):** Manages order creation and retrieval.
- **Admin (`/api/admin`):** Provides data for the admin dashboard, including analytics, product management, and order details.

## Service Layer (`src/services`)

The service layer contains the bulk of the backend logic, ensuring it is decoupled from the API routes.

- **`services/payment/`:** A comprehensive module for payment processing.
  - **`payment-service.ts`:** Core logic for creating and managing payments.
  - **`cashier-client.ts`:** Client for interacting with the Kashier payment gateway API.
  - **`encryption.ts`:** Handles encryption and decryption of sensitive payment data.
  - **`monitoring.ts`:** Provides health checks and monitoring for the payment system.
  - **`fraud-detection.ts` & `rate-limiter.ts`:** Security modules to prevent fraud and abuse.
