# Multi-Tenant Code Updates Documentation

## Overview
This document describes the changes made to convert the application code from single-tenant to multi-tenant architecture.

## Changes Summary

### 1. Admin Client (`src/lib/supabase/admin.ts`)
**Added:**
- `DEFAULT_STORE_ID` constant (`00000000-0000-0000-0000-000000000001`)
- `getStoreIdFromRequest()` - Extracts store_id from request headers (set by middleware)
- `getStoreSubdomainFromRequest()` - Extracts store subdomain from headers
- `createStoreAdminClient(storeId)` - Creates admin client with store context

### 2. Store Utilities (`src/lib/store-utils.ts`) - NEW FILE
**Added:**
- `isMultiTenantEnabled()` - Check if multi-tenant mode is on
- `getPlatformDomain()` - Get platform domain
- `getClientSubdomain()` - Extract subdomain client-side
- `getStoreUrl()`, `getStoreAdminUrl()`, `getPlatformUrl()` - URL generators
- `isValidSubdomain()`, `isReservedSubdomain()`, `canUseSubdomain()` - Validation
- `RESERVED_SUBDOMAINS` - List of reserved subdomains
- Type definitions: `StoreInfo`, `StoreStats`

### 3. API Routes Updated

#### Products Admin API (`src/app/api/admin/products/route.ts`)
- GET: Added `.eq("store_id", storeId)` filter
- POST: Added `store_id: storeId` to insert data

#### Product Details API (`src/app/api/admin/products/[id]/route.ts`)
- GET: Added store_id verification
- PATCH: Added store_id verification (prevents cross-store updates)
- DELETE: Added store ownership verification before deletion

#### Product Variants API (`src/app/api/admin/products/variants/route.ts`)
- POST: Verify product belongs to store before adding variant
- Added `store_id` to variant insert

#### Product Images API (`src/app/api/admin/products/images/route.ts`)
- POST: Verify product belongs to store before adding image
- Added `store_id` to image insert

#### Orders Admin API (`src/app/api/admin/orders/route.ts`)
- GET: Added `.eq("store_id", storeId)` filter

#### Order Details API (`src/app/api/admin/orders/[id]/route.ts`)
- PATCH: Added store_id verification
- GET: Added store_id verification
- DELETE: Added store ownership verification

#### Categories Admin API (`src/app/api/admin/categories/route.ts`)
- GET: Added `.eq("store_id", storeId)` filter
- POST: Added `store_id` to insert

#### Analytics API (`src/app/api/admin/analytics/route.ts`)
- All queries filtered by store_id

#### Dashboard API (`src/app/api/admin/dashboard/route.ts`)
- All queries (orders, products, customers, variants) filtered by store_id

#### Public Categories API (`src/app/api/categories/route.ts`)
- GET: Added store_id filter

#### Paginated Products API (`src/app/api/products/paginated/route.ts`)
- GET: Added `.eq('store_id', storeId)` filter

#### Order Create API (`src/app/api/orders/create/route.ts`)
- Customer upsert: Added `store_id`
- Order insert: Added `store_id`
- Order items insert: Added `store_id`

#### Cart Add API (`src/app/api/cart/add/route.ts`)
- Select: Added store_id filter
- Insert: Added `store_id`
- Update: Added store_id verification

### 4. Analytics Server Tracker (`src/lib/analytics/server-tracker.ts`)
- Added `storeId` to payload interface
- Insert analytics events with `store_id`

## How Store ID is Determined

1. **Middleware** (`src/middleware.ts`):
   - Extracts subdomain from hostname
   - Looks up store in database by subdomain
   - Sets `x-store-id` header on the request

2. **API Routes**:
   - Call `getStoreIdFromRequest()` to read from headers
   - Falls back to `DEFAULT_STORE_ID` if not in multi-tenant mode

3. **Client-Side**:
   - `useStore()` hook provides current store context
   - `useStoreQuery()` hook automatically filters queries by store_id

## Security Considerations

1. **Store Isolation**: All queries filter by store_id
2. **Ownership Verification**: Before update/delete, verify record belongs to current store
3. **Reserved Subdomains**: `RESERVED_SUBDOMAINS` prevents common subdomain squatting

## Environment Variables

```env
NEXT_PUBLIC_ENABLE_MULTI_TENANT=true
NEXT_PUBLIC_PLATFORM_DOMAIN=makastore.com
```

## Testing Multi-Tenant

1. Run SQL setup: `ALL-IN-ONE-SETUP.sql`
2. Run partitioning: `STEP2-PARTITIONING.sql`
3. Enable multi-tenant in `.env.local`:
   ```
   NEXT_PUBLIC_ENABLE_MULTI_TENANT=true
   NEXT_PUBLIC_PLATFORM_DOMAIN=localhost
   ```
4. Access stores via subdomains: `http://store1.localhost:3000`

## Files Changed

| File | Type | Changes |
|------|------|---------|
| `src/lib/supabase/admin.ts` | Modified | Added store helpers |
| `src/lib/store-utils.ts` | New | Store utility functions |
| `src/app/api/admin/products/route.ts` | Modified | Store filtering |
| `src/app/api/admin/products/[id]/route.ts` | Modified | Store verification |
| `src/app/api/admin/products/variants/route.ts` | Modified | Store filtering |
| `src/app/api/admin/products/images/route.ts` | Modified | Store filtering |
| `src/app/api/admin/orders/route.ts` | Modified | Store filtering |
| `src/app/api/admin/orders/[id]/route.ts` | Modified | Store verification |
| `src/app/api/admin/categories/route.ts` | Modified | Store filtering |
| `src/app/api/admin/analytics/route.ts` | Modified | Store filtering |
| `src/app/api/admin/dashboard/route.ts` | Modified | Store filtering |
| `src/app/api/categories/route.ts` | Modified | Store filtering |
| `src/app/api/products/paginated/route.ts` | Modified | Store filtering |
| `src/app/api/orders/create/route.ts` | Modified | Store_id insertion |
| `src/app/api/cart/add/route.ts` | Modified | Store filtering |
| `src/lib/analytics/server-tracker.ts` | Modified | Store_id in events |

## Backward Compatibility

- If `NEXT_PUBLIC_ENABLE_MULTI_TENANT` is not set or `false`:
  - All queries use `DEFAULT_STORE_ID`
  - Application works in single-tenant mode
  - No breaking changes for existing deployments
