# Store Creation Flow - Visual Guide

## 1. Authentication Flow

### User Journey - New Store Creation

```
┌─────────────────────────────────────────────────────────────────┐
│ User Visits /create-store (Not Logged In)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Middleware Check:                                               │
│ - Is /create-store in PUBLIC_PATHS?                             │
│ - No ❌ (removed in this implementation)                        │
│ - Is user authenticated?                                        │
│ - No ❌                                                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Redirect to: /auth?next=%2Fcreate-store                         │
│ (The ?next= parameter preserves the original URL)               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
         ┌──────────────────┐  ┌──────────────────┐
         │   Login Tab      │  │   Signup Tab     │
         ├──────────────────┤  ├──────────────────┤
         │ - Email          │  │ - Email          │
         │ - Password       │  │ - Name           │
         │ - [Login Button] │  │ - Phone          │
         └────────┬─────────┘  └────────┬─────────┘
                  │                     │
                  │  ┌──────────────────┘
                  │  │
         ┌────────▼──▼─────────────────┐
         │ Authenticate User           │
         │ (supabase.auth.signIn...)   │
         └────────┬────────────────────┘
                  │
                  ▼
    ┌─────────────────────────────────┐
    │ Check searchParams.get('next')  │
    │ Value: /create-store            │
    └────────┬────────────────────────┘
             │
             ▼
  ┌──────────────────────────────────┐
  │ router.push(next_parameter)      │
  │ → Redirects to /create-store ✓  │
  └──────────────────────────────────┘
```

---

## 2. Store Creation Page Flow

### Before vs After

#### ❌ BEFORE (Old Flow)
```
Store Creation Page
├── Step 1: Store Details
│   ├── Store Name     [____________]
│   ├── Subdomain      [____________]
│   ├── Email          [____________]  ← Can be new email
│   ├── Password       [____________]  ← Create new account
│   ├── Confirm Pass   [____________]
│   ├── Phone          [____________]
│   └── Description    [____________]
└── Step 2: Choose Plan & Pay

Result: New account created during store creation
```

#### ✅ AFTER (New Flow)
```
Store Creation Page
├── Step 1: Store Details
│   ├── Store Name     [____________]
│   ├── Subdomain      [____________]
│   ├── Email          [user@mail.com]  ← Pre-filled, READ-ONLY
│   ├── Phone          [____________]   ← (Optional)
│   └── Description    [____________]   ← (Optional)
└── Step 2: Choose Plan & Pay

Result: Uses existing logged-in user account
```

**Key Differences:**
- ✅ Email is read-only (confirms user identity)
- ✅ No password fields (user already logged in)
- ✅ Simpler form (only essential fields)
- ✅ Faster onboarding (1 less step)

---

## 3. API Authentication Change

### Store Creation API - Authentication Flow

```
POST /api/stores/create
├── Body Payload
│   ├── store_name: "My Store"
│   ├── subdomain: "mystore"
│   ├── slug: "mystore"
│   ├── phone: "+20123456789" (optional)
│   ├── description: "..." (optional)
│   └── plan_id: "uuid"
│       ❌ NO email
│       ❌ NO password
│
└── API Processing
    │
    ├─ Step 1: Create Supabase client with cookies
    │  └─ Extract session from request.cookies
    │
    ├─ Step 2: Authenticate user
    │  ├─ supabase.auth.getUser()
    │  ├─ If error or !user → return 401 ❌
    │  └─ If authenticated → Continue ✓
    │
    ├─ Step 3: Validate store data
    │  ├─ Check subdomain available
    │  ├─ Check user doesn't own store (optional)
    │  └─ Check subscription plan
    │
    ├─ Step 4: Create store
    │  ├─ owner_id: user.id ← Authenticated user
    │  ├─ email: user.email ← From session
    │  ├─ Other fields...
    │  └─ subscription_status: "pending_payment" or "trial"
    │
    ├─ Step 5: Create related records
    │  ├─ store_settings
    │  ├─ design_settings
    │  └─ subscriptions record
    │
    ├─ Step 6: Update user profile
    │  └─ Set store_id and role on profile
    │
    └─ Step 7: Return success response
       ├─ store data
       ├─ requires_payment (boolean)
       └─ payment URL (if payment needed)
```

---

## 4. Payment Status & Admin Access

### Store Access Rules Based on Subscription Status

```
Store with subscription_status: 'pending_payment'
│
├─ Public Access: http://[subdomain].domain.com
│  │
│  └─ Middleware Check (handleStoreSubdomain)
│     ├─ Is store.subscription_status == 'pending_payment'? ✓ YES
│     └─ Redirect to /store-pending-payment ❌
│        └─ "المتجر في انتظار الدفع" (Payment Required)
│
└─ Admin Access: http://[subdomain].domain.com/admin
   │
   └─ Middleware Check (handleStoreAdminAuth)
      ├─ Does store exist? ✓ YES
      ├─ Is user authenticated? ✓ YES
      ├─ Does user own store? ✓ YES
      ├─ Is subscription status checked? ❌ NO
      └─ Allow access ✓ Admin dashboard loads!
```

**Key Points:**
- ✅ **Admin access is NOT blocked** by payment status
- ❌ **Public store access IS blocked** by pending payment
- ✅ Store owners can manage their store even if payment is pending
- ❌ Customers cannot see the store until payment is complete

---

## 5. User Profile Update Flow

### What Happens to User Profile During Store Creation

```
Before Store Creation
┌─────────────────────────┐
│ User Profile (profiles) │
├─────────────────────────┤
│ id: uuid                │
│ email: user@mail.com    │
│ full_name: "John Doe"   │
│ role: "user"            │
│ store_id: NULL          │ ← No store yet
│ created_at: 2024-01-10  │
│ updated_at: 2024-01-10  │
└─────────────────────────┘
                ↓
        [Create Store]
                ↓
After Store Creation
┌─────────────────────────┐
│ User Profile (profiles) │
├─────────────────────────┤
│ id: uuid                │
│ email: user@mail.com    │
│ full_name: "John Doe"   │
│ role: "store_owner"     │ ← Updated
│ store_id: store_uuid    │ ← Now linked
│ created_at: 2024-01-10  │
│ updated_at: 2024-01-13  │ ← Updated
└─────────────────────────┘
```

---

## 6. Complete User Journey

```
┌─────────────────────────────────────────────────────────┐
│ User has no account                                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
        Visit /create-store
                 │
                 ▼
      ❌ Not authenticated
      Redirect to /auth?next=%2Fcreate-store
                 │
    ┌────────────┴────────────┐
    │ Click "Create Account"  │
    └────────────┬────────────┘
                 │
                 ▼
    Fill signup form
    ├─ Email: new@mail.com
    ├─ Password: ••••••••
    ├─ Name: John Doe
    ├─ Phone: 0101234567
    └─ [Sign Up]
                 │
                 ▼
    Account created + Auto-login
                 │
                 ▼
    Redirect to /create-store (via next parameter)
                 │
                 ▼
    ┌──────────────────────────────────────┐
    │ Store Creation Form (Now Logged In)  │
    ├──────────────────────────────────────┤
    │ Store Name:   [My Shop           ]   │
    │ Subdomain:    [my-shop           ]   │
    │ Email:        [new@mail.com]  RO     │
    │ Phone:        [0101234567       ]    │
    │ Description:  [My awesome shop  ]    │
    │                                      │
    │ [← Previous]  [Next - Choose Plan →] │
    └────────┬─────────────────────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Choose Subscription Plan │
    ├──────────────────────────┤
    │ ☐ Trial (14 days)        │
    │ ◉ Monthly Plan ($50)     │ ← Selected
    │ ☐ Yearly Plan ($500)     │
    │                          │
    │ [← Previous] [Pay Now →] │
    └────────┬─────────────────┘
             │
             ▼
    Redirect to Payment Gateway (Kashier)
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
  ✅ Payment      ❌ Payment
  Successful      Failed/Cancelled
    │                 │
    ▼                 ▼
  Store Active    Store Pending
  Status:         Status: 
  pending_payment pending_payment
    │                 │
    ├─Public:       ├─Public:
    │ BLOCKED ❌     │ BLOCKED ❌
    │                 │
    └─Admin:        └─Admin:
      ALLOWED ✓       ALLOWED ✓
```

---

## 7. Middleware Routes Summary

### Public Paths (No Auth Required)
```
✓ /landing
✓ /admin/login
✓ /admin/signup
✓ /checkout/subscription
✓ /subscription/success
✓ /subscription/cancel
✓ /store-pending-payment
✓ /store-trial-expired
✓ /store-subscription-expired
✓ /super-admin/login

❌ /create-store (REMOVED - now requires auth)
```

### Protected Paths (Auth Required)
```
✗ /create-store ← PROTECTED (requires login)
✗ /admin/* (requires auth + admin role)
✗ /api/admin/* (requires auth + admin role)
✗ /super-admin/* (requires super_admin role)
```

### Subdomain Routes
```
[subdomain]/admin
  └─ handleStoreAdminAuth()
     ├─ Check: Store exists?
     ├─ Check: User authenticated?
     ├─ Check: User owns store?
     └─ NO payment check ✓

[subdomain]/
  └─ handleStoreSubdomain()
     ├─ Check: Store exists?
     ├─ Check: subscription_status
     │  ├─ pending_payment → /store-pending-payment
     │  ├─ trial_expired → /store-trial-expired
     │  ├─ expired → /store-subscription-expired
     │  └─ active → Continue
     └─ Render store
```

---

## 8. Error Scenarios

### Scenario 1: Unauthenticated Access to /create-store
```
Request: GET /create-store
├─ No authentication cookies
└─ Middleware redirects to /auth?next=%2Fcreate-store
   Response: 307 Redirect
```

### Scenario 2: API Call Without Authentication
```
Request: POST /api/stores/create
Body: {store_name, subdomain, ...}
├─ No session cookies
└─ API returns 401 Unauthorized
   Response: {error: "User must be logged in to create a store"}
```

### Scenario 3: Subdomain Access with Pending Payment
```
Request: GET http://mystore.domain.com
├─ handleStoreSubdomain() checks
├─ subscription_status = 'pending_payment'
└─ Middleware rewrites to /store-pending-payment
   Response: Shows payment required page
```

### Scenario 4: Admin Access with Pending Payment
```
Request: GET http://mystore.domain.com/admin
├─ handleStoreAdminAuth() checks
├─ User authenticated & owns store
├─ NO subscription check ✓
└─ Next handler processes request
   Response: Admin dashboard loads
```

---

## Summary Table

| Feature | Before | After |
|---------|--------|-------|
| **Store Creation** | Public | Protected (Requires Login) |
| **Email Field** | Required, writable | Read-only (pre-filled) |
| **Password Fields** | Required (create account) | Removed (use existing) |
| **Account Creation** | During store creation | Must create first |
| **Profile Update** | Create new | Update existing |
| **Admin Access** | Works | Still works (payment-independent) |
| **Public Access** | Blocked if unpaid | Blocked if unpaid |
| **Payment Required** | For all paid plans | For all paid plans |

