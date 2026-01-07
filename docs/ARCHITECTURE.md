# Makastore Architecture Overview

This document provides a high-level overview of the Makastore e-commerce project structure.

## Frontend (`src/app` + `src/components`)

The frontend is a Next.js application using the App Router.

- **Public Pages:** Located directly under `src/app`, such as `/`, `/about`, `/cart`, etc.
- **Product Pages:** Dynamic routes like `/product/[id]` and `/category/[slug]`.
- **Admin Dashboard:** All admin-related pages are grouped under `src/app/admin` and `src/app/idara-alkhasa`.

Reusable React components are located in `src/components`, categorized by UI primitives (`ui/`) and feature-specific components.

```
src/
├── app/
│   ├── (public)/
│   ├── admin/
│   └── idara-alkhasa/
└── components/
    ├── ui/
    └── ...
```

## State Management (`src/store`)

Global frontend state is managed using Zustand. Each store is responsible for a specific domain:

- **`auth-store`:** Manages user authentication state.
- **`cart-store`:** Manages the shopping cart items and totals.
- **`settings-store`:** Manages application settings.
- **`design-store`:** Manages dynamic theme and design settings.
- **`pages-store`:** Manages content for static pages.

## Backend (`src/app/api` + `src/services`)

The backend consists of API routes that delegate business logic to dedicated service modules.

- **API Routes (`src/app/api`):** Handle HTTP requests for specific domains like `/api/payment`, `/api/orders`, and `/api/auth`.
- **Services (`src/services`):** Contain the core backend logic. For example, `src/services/payment` handles all payment processing, fraud detection, and monitoring.

## Shared Layer (`src/lib`)

This directory contains code shared across the frontend and backend.

- **Utilities:** `utils.ts`, `types.ts`, and Supabase client helpers.
- **Shims:** To maintain backwards compatibility after the refactor, several files in `src/lib` (e.g., `auth-store.ts`, `cart-store.ts`) re-export modules from their new locations in `src/store` and `src/services`.

## Database & Scripts (`database/`, `scripts/`)

- **`database/schema.sql`:** Defines the PostgreSQL database schema.
- **`scripts/*.sql`:** Contains SQL scripts for seeding the database with initial data, setting up storage, and running migrations.
