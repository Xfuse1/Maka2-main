# Multi-Tenant API Updates Summary

## Overview
تم تحديث جميع API routes للعمل مع نظام Multi-Tenant باستخدام `store_id` filtering.

## Core Helper Functions

### `src/lib/supabase/admin.ts`
- `DEFAULT_STORE_ID` = `"00000000-0000-0000-0000-000000000001"`
- `getStoreIdFromRequest()` - يستخرج store_id من headers أو يرجع DEFAULT
- `getStoreSubdomainFromRequest()` - يستخرج subdomain من headers
- `createStoreAdminClient(storeId)` - ينشئ client مع store context

### `src/lib/store-utils.ts`
- `getStoreIdFromUrl()` - يستخرج store_id من URL
- `getStoreSubdomainFromUrl()` - يستخرج subdomain من URL
- `isMultiTenantEnabled()` - يتحقق من تفعيل multi-tenant

---

## Updated API Routes (52 routes total)

### Admin Products
| Route | Method | Changes |
|-------|--------|---------|
| `admin/products/route.ts` | GET | Filter by store_id |
| `admin/products/route.ts` | POST | Include store_id in insert |
| `admin/products/[id]/route.ts` | GET/PATCH/DELETE | Ownership verification |
| `admin/products/variants/route.ts` | POST | Include store_id |
| `admin/products/variants/[id]/route.ts` | PATCH | Verify product belongs to store |
| `admin/products/images/route.ts` | POST | Include store_id |

### Admin Orders
| Route | Method | Changes |
|-------|--------|---------|
| `admin/orders/route.ts` | GET | Filter by store_id |
| `admin/orders/[id]/route.ts` | GET/PATCH/DELETE | Ownership verification |
| `admin/orders/update-last/route.ts` | POST | Filter by store_id |

### Admin Categories
| Route | Method | Changes |
|-------|--------|---------|
| `admin/categories/route.ts` | GET/POST | Filter and include store_id |
| `admin/categories/[id]/route.ts` | GET/PATCH/DELETE | Ownership verification |
| `admin/categories/upload/route.ts` | POST | No changes (storage only) |

### Admin Analytics
| Route | Method | Changes |
|-------|--------|---------|
| `admin/analytics/route.ts` | GET | Filter by store_id |
| `admin/analytics/events-summary/route.ts` | GET | Filter by store_id |
| `admin/analytics/top-viewed-products/route.ts` | GET | Filter by store_id |
| `admin/analytics/products-funnel/route.ts` | GET | Filter by store_id |
| `admin/dashboard/route.ts` | GET | All queries filtered |

### Admin Design
| Route | Method | Changes |
|-------|--------|---------|
| `admin/design/settings/route.ts` | GET/POST | Filter by store_id |
| `admin/design/logo/route.ts` | GET/POST | Filter by store_id, prefix files with store_id |

### Admin Pages
| Route | Method | Changes |
|-------|--------|---------|
| `admin/pages/route.ts` | GET/POST | Filter and include store_id |
| `admin/pages/[id]/route.ts` | PATCH/DELETE | Ownership verification |

### Admin Offers
| Route | Method | Changes |
|-------|--------|---------|
| `admin/offers/route.ts` | GET/POST | Filter and include store_id |
| `admin/offers/[id]/route.ts` | PATCH/DELETE | Ownership verification |

### Admin Messages
| Route | Method | Changes |
|-------|--------|---------|
| `admin/messages/route.ts` | GET | Filter by store_id |
| `admin/messages/diagnostics/route.ts` | GET | Filter by store_id |

### Admin Hero Slides
| Route | Method | Changes |
|-------|--------|---------|
| `admin/hero-slides/route.ts` | GET/POST | Filter and include store_id |

### Admin Shipping
| Route | Method | Changes |
|-------|--------|---------|
| `admin/shipping/route.ts` | GET/POST/PATCH/DELETE | All operations filtered |

### Public Routes
| Route | Method | Changes |
|-------|--------|---------|
| `categories/route.ts` | GET | Filter by store_id |
| `products/paginated/route.ts` | GET | Filter by store_id |
| `products/[id]/recommendations/route.ts` | GET | Filter by store_id |
| `orders/create/route.ts` | POST | Include store_id in orders, customers, order_items |
| `orders/search/route.ts` | GET | Filter by store_id |
| `orders/[orderId]/cancel/route.ts` | POST | No changes (uses user auth) |
| `cart/add/route.ts` | POST | Filter and include store_id |
| `contact/route.ts` | POST | Include store_id |
| `store/name/route.ts` | GET | Filter by store_id |

### Seed Routes
| Route | Method | Changes |
|-------|--------|---------|
| `seed-policies/route.ts` | POST | Include store_id |
| `seed-about/route.ts` | POST | Review needed |

### Analytics Tracking
| Route | Method | Changes |
|-------|--------|---------|
| `analytics/track/route.ts` | POST | Uses server-tracker with store_id |
| `analytics/vitals/route.ts` | POST | No changes (performance metrics) |

---

## Routes NOT Requiring store_id

### Auth Routes (Platform-level authentication)
- `auth/signup/route.ts`
- `auth/signup-admin/route.ts`
- `auth/signup-web/route.ts`
- `auth/login/route.ts`
- `auth/add-to-store/route.ts` - Already uses store_id properly
- `auth/check-store-membership/route.ts` - Already uses store_id properly

### Admin User Management
- `admin/users/create-admin/route.ts` - Platform-level

### Stores Management
- `stores/create/route.ts` - Creates new stores (platform-level)

### Payment Routes (Use order ownership)
- `payment/create/route.ts` - Orders already have store_id
- `payment/webhook/route.ts` - Webhook processing
- `payment/health/route.ts` - Health check only

### Debug Routes (Development only)
- `debug/env/route.ts`
- `debug/list-users/route.ts`

### AI Routes (No database storage)
- `ai/rewrite-ar/route.ts`
- `ai/translate-to-en/route.ts`

### Store Settings
- `store-settings/route.ts` - Uses getStoreSettingsServer with store_id

---

## Lib Files Updated

### `src/lib/store-settings.ts`
- Updated to use `store_id` instead of fixed ID
- Uses `getStoreIdFromRequest()` for context

### `src/lib/analytics/server-tracker.ts`
- Already updated to include `store_id` in events
- Falls back to `DEFAULT_STORE_ID` if not available

### `src/lib/store-context.tsx`
- Fixed TypeScript inference issue

---

## Pattern Used

```typescript
// In each route:
import { getSupabaseAdminClient, getStoreIdFromRequest } from "@/lib/supabase/admin"

export async function GET() {
  const supabase = getSupabaseAdminClient()
  const storeId = await getStoreIdFromRequest()

  // Filter queries
  const { data } = await supabase
    .from("table_name")
    .select("*")
    .eq("store_id", storeId)
  
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient()
  const storeId = await getStoreIdFromRequest()
  const body = await request.json()

  // Include store_id in inserts
  const { data } = await supabase
    .from("table_name")
    .insert({ ...body, store_id: storeId })
  
  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }) {
  const supabase = getSupabaseAdminClient()
  const storeId = await getStoreIdFromRequest()
  const body = await request.json()
  
  // Prevent changing store_id
  delete body.store_id

  // Ownership verification
  const { data } = await supabase
    .from("table_name")
    .update(body)
    .eq("id", params.id)
    .eq("store_id", storeId)  // Ensure ownership
  
  return NextResponse.json(data)
}
```

---

## Security Notes

1. **Ownership Verification**: All PATCH/DELETE operations verify that the resource belongs to the current store
2. **Prevent store_id Override**: Body `store_id` is deleted before updates to prevent cross-store attacks
3. **Default Fallback**: Falls back to `DEFAULT_STORE_ID` for backward compatibility
4. **Header-Based**: `store_id` comes from `x-store-id` header set by middleware

---

## Testing Checklist

- [ ] Products CRUD with different stores
- [ ] Orders filtering by store
- [ ] Categories isolation between stores
- [ ] Analytics data separation
- [ ] Design settings per store
- [ ] Hero slides per store
- [ ] Shipping zones per store
- [ ] Contact messages per store
- [ ] Payment flow with store context
