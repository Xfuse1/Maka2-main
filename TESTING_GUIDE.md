# Store Creation Flow - Testing Guide

## Pre-Testing Checklist

Before testing, ensure:
- [ ] All code changes have been deployed
- [ ] Node modules installed (`pnpm install`)
- [ ] Environment variables configured
- [ ] Supabase project active
- [ ] Database schema up to date
- [ ] Subscription plans configured in database
- [ ] Browser cache cleared

---

## Test Suite 1: Authentication & Access Control

### Test 1.1: Unauthenticated Access to Store Creation
**Objective:** Verify that unauthenticated users cannot access `/create-store`

**Steps:**
1. Open new incognito/private browser window
2. Clear all cookies
3. Navigate to `http://localhost:3000/create-store`

**Expected Results:**
- ✅ Automatically redirected to `/auth` page
- ✅ URL shows `?next=%2Fcreate-store` parameter
- ✅ User can see login form

**Test Result:** [ ] PASS [ ] FAIL

---

### Test 1.2: Login with Next Parameter
**Objective:** Verify that login redirects back to store creation

**Steps:**
1. Start from `/auth?next=%2Fcreate-store` page
2. Click on "Login" tab
3. Enter valid credentials:
   - Email: `test@example.com`
   - Password: `TestPassword123`
4. Click "Login" button

**Expected Results:**
- ✅ User authenticated successfully
- ✅ Automatically redirected to `/create-store` (not home)
- ✅ Can see store creation form

**Test Result:** [ ] PASS [ ] FAIL

---

### Test 1.3: Signup with Next Parameter
**Objective:** Verify that signup redirects back to store creation

**Steps:**
1. Start from `/auth?next=%2Fcreate-store` page
2. Click on "Create Account" tab
3. Fill signup form:
   - Email: `newuser@example.com`
   - Password: `NewPassword123`
   - Name: `Test User`
   - Phone: `01012345678`
4. Click "Sign Up" button

**Expected Results:**
- ✅ Account created successfully
- ✅ Auto-login occurs
- ✅ Automatically redirected to `/create-store`
- ✅ Email field shows the new user's email

**Test Result:** [ ] PASS [ ] FAIL

---

## Test Suite 2: Store Creation Form

### Test 2.1: Email Field is Read-Only
**Objective:** Verify email field shows logged-in user's email as read-only

**Steps:**
1. Login as existing user: `user1@example.com`
2. Navigate to `/create-store`
3. Observe email field

**Expected Results:**
- ✅ Email field displays `user1@example.com`
- ✅ Field is read-only (cannot be edited)
- ✅ Field has disabled styling (grayed out)
- ✅ Tooltip shows: "هذا البريد الإلكتروني مرتبط بحسابك ولا يمكن تغييره هنا"

**Test Result:** [ ] PASS [ ] FAIL

---

### Test 2.2: No Password Fields in Form
**Objective:** Verify password fields are completely removed

**Steps:**
1. Login and navigate to `/create-store`
2. Inspect the form

**Expected Results:**
- ✅ No "Password" field visible
- ✅ No "Confirm Password" field visible
- ✅ No eye/visibility toggle button
- ✅ No password-related validation messages

**Form Should Show:**
- Store Name
- Subdomain
- Email (read-only)
- Phone (optional)
- Description (optional)

**Test Result:** [ ] PASS [ ] FAIL

---

### Test 2.3: Subdomain Validation
**Objective:** Verify subdomain validation works correctly

**Steps:**
1. Login and navigate to `/create-store`
2. Fill form:
   - Store Name: `Test Store`
   - Subdomain: `test-store`
3. Wait for validation (500ms debounce)

**Expected Results:**
- ✅ Shows "جاري التحقق..." (Checking...)
- ✅ Shows green checkmark "العنوان متاح!" (Available)
- ✅ Can proceed to next step

**Test Step 2 - Invalid Subdomain:**
1. Change subdomain to: `my_store` (underscore not allowed)

**Expected Results:**
- ✅ Shows red X "العنوان محجوز" (Taken)
- ✅ Cannot proceed to next step (button disabled)

**Test Result:** [ ] PASS [ ] FAIL

---

### Test 2.4: Required Fields Validation
**Objective:** Verify form validates required fields

**Steps:**
1. Login and navigate to `/create-store`
2. Leave "Store Name" empty
3. Click "التالي - اختيار الباقة" (Next)

**Expected Results:**
- ✅ Form does not submit
- ✅ Error message: "يرجى ملء جميع الحقول المطلوبة" (Fill all required fields)

**Test Step 2 - Valid Submission:**
1. Fill all required fields:
   - Store Name: `My Test Store`
   - Subdomain: `test123`
2. Click "التالي - اختيار الباقة" (Next)

**Expected Results:**
- ✅ Form submits successfully
- ✅ Progress to Step 2 (Choose Plan)
- ✅ Can see plan selection cards

**Test Result:** [ ] PASS [ ] FAIL

---

## Test Suite 3: Store Creation API

### Test 3.1: API Authentication Requirement
**Objective:** Verify API requires authentication

**Steps:**
1. Use REST client (Postman, curl, etc.)
2. Send POST request to `/api/stores/create` **without cookies**
3. Payload:
   ```json
   {
     "store_name": "Test Store",
     "subdomain": "teststore",
     "slug": "teststore",
     "plan_id": "uuid-of-plan"
   }
   ```

**Expected Results:**
- ✅ Returns HTTP 401 Unauthorized
- ✅ Response body: `{error: "User must be logged in to create a store"}`

**Test Result:** [ ] PASS [ ] FAIL

---

### Test 3.2: API Creates Store with Authenticated User
**Objective:** Verify API creates store with authenticated user ID

**Steps:**
1. Login as user: `user2@example.com` (ID: `abc123`)
2. Navigate to `/create-store`
3. Fill and submit form with:
   - Store Name: `Auth Test Store`
   - Subdomain: `authtest`
   - Plan: `Trial Plan` (Free)
4. Click create button

**Expected Results:**
- ✅ Store created successfully
- ✅ Store `owner_id` = `abc123` (authenticated user's ID)
- ✅ Store `email` = `user2@example.com` (authenticated user's email)
- ✅ User's profile updated with `store_id`
- ✅ User's profile `role` = `store_owner`

**Verification in Database:**
```sql
-- Check store was created with correct owner
SELECT id, owner_id, email, store_name, subdomain 
FROM stores 
WHERE subdomain = 'authtest';

-- Check profile was updated
SELECT id, email, store_id, role 
FROM profiles 
WHERE email = 'user2@example.com';
```

**Test Result:** [ ] PASS [ ] FAIL

---

### Test 3.3: API Response with Payment Required
**Objective:** Verify API correctly returns payment requirement

**Steps:**
1. Complete store creation with a paid plan:
   - Select "Monthly Plan ($50)" 
2. Check API response

**Expected Results:**
- ✅ Response status: 201 Created
- ✅ Response includes:
   ```json
   {
     "success": true,
     "store": {...},
     "requires_payment": true,
     "plan": {
       "id": "uuid",
       "name": "Monthly",
       "price": 50,
       "duration_days": 30
     }
   }
   ```

**Test Result:** [ ] PASS [ ] FAIL

---

### Test 3.4: API Response for Free Plan
**Objective:** Verify API returns no payment required for free plans

**Steps:**
1. Complete store creation with trial plan:
   - Select "Trial (14 days free)"
2. Check API response

**Expected Results:**
- ✅ Response status: 201 Created
- ✅ Response includes:
   ```json
   {
     "success": true,
     "store": {...},
     "requires_payment": false,
     "plan": {
       "id": "uuid",
       "name": "Trial",
       "price": 0,
       "duration_days": 14
     }
   }
   ```
- ✅ Store `subscription_status` = `trial`
- ✅ Store `trial_ends_at` is set to 14 days from now

**Test Result:** [ ] PASS [ ] FAIL

---

## Test Suite 4: Payment & Subscription Status

### Test 4.1: Pending Payment - Public Access Blocked
**Objective:** Verify public store access is blocked for pending payment

**Steps:**
1. Create store with paid plan
2. Do NOT complete payment
3. Open browser to `http://teststore.localhost:3000/` (public store URL)
   - Or: `https://teststore.domain.com/` (production)

**Expected Results:**
- ✅ Automatically redirected to `/store-pending-payment`
- ✅ Shows message: "المتجر في انتظار الدفع" (Store Pending Payment)
- ✅ Shows action buttons:
  - "إتمام الدفع" (Complete Payment)
  - "العودة للرئيسية" (Back to Home)

**Test Result:** [ ] PASS [ ] FAIL

---

### Test 4.2: Pending Payment - Admin Access Allowed
**Objective:** Verify admin access is allowed even with pending payment

**Steps:**
1. Same store as Test 4.1 (with pending payment)
2. Navigate to admin:
   - `http://teststore.localhost:3000/admin`
   - Or: `https://teststore.domain.com/admin` (production)
3. Login with store owner's credentials

**Expected Results:**
- ✅ Admin login page loads
- ✅ Can login successfully
- ✅ Admin dashboard loads and functions
- ✅ Store settings are accessible
- ✅ Can manage products, orders, etc.

**Note:** Payment status should NOT block admin access

**Test Result:** [ ] PASS [ ] FAIL

---

### Test 4.3: Trial Plan - Active Store
**Objective:** Verify trial plans make store active

**Steps:**
1. Create store with trial plan
2. Complete store creation

**Expected Results:**
- ✅ Store `subscription_status` = `trial`
- ✅ Store `status` = `active`
- ✅ Public access works: `http://teststore.localhost:3000/`
- ✅ Shows store content (not payment page)
- ✅ Admin access works
- ✅ Trial expiration is set 14 days from now

**Test Result:** [ ] PASS [ ] FAIL

---

### Test 4.4: Trial Plan - Expired
**Objective:** Verify expired trial stores are blocked

**Prerequisites:**
- Manually set trial_ends_at to a past date in database:
  ```sql
  UPDATE stores 
  SET trial_ends_at = NOW() - INTERVAL '1 day'
  WHERE subdomain = 'teststore';
  ```

**Steps:**
1. Navigate to expired trial store: `http://teststore.localhost:3000/`

**Expected Results:**
- ✅ Redirected to `/store-trial-expired`
- ✅ Shows message: "مدة التجربة انتهت" (Trial Expired)
- ✅ Admin access still works

**Test Result:** [ ] PASS [ ] FAIL

---

## Test Suite 5: Authentication Edge Cases

### Test 5.1: Direct API Call Without Session
**Objective:** Verify API requires valid session

**Steps:**
1. Clear cookies
2. Send API request with curl/Postman:
   ```bash
   curl -X POST http://localhost:3000/api/stores/create \
     -H "Content-Type: application/json" \
     -d '{
       "store_name": "Test",
       "subdomain": "test",
       "slug": "test",
       "plan_id": "uuid"
     }'
   ```

**Expected Results:**
- ✅ HTTP 401 Unauthorized
- ✅ Error message: `"User must be logged in to create a store"`

**Test Result:** [ ] PASS [ ] FAIL

---

### Test 5.2: Expired Session
**Objective:** Verify handling of expired sessions

**Steps:**
1. Login to get session
2. Wait for session to expire (Supabase default: 1 hour)
   - Or: Manually delete session cookies
3. Try to create store

**Expected Results:**
- ✅ Form submission returns 401
- ✅ Error message displayed to user
- ✅ User is prompted to login again

**Test Result:** [ ] PASS [ ] FAIL

---

### Test 5.3: Multiple Users Creating Stores
**Objective:** Verify each user gets their own store

**Steps:**
1. Create store as User A: `usera@example.com`
   - Store name: `Store A`
   - Subdomain: `storea`
2. Logout
3. Create store as User B: `userb@example.com`
   - Store name: `Store B`
   - Subdomain: `storeb`

**Expected Results - User A's Store:**
- ✅ `owner_id` = User A's UUID
- ✅ `email` = `usera@example.com`
- ✅ User A's profile has `store_id`

**Expected Results - User B's Store:**
- ✅ `owner_id` = User B's UUID
- ✅ `email` = `userb@example.com`
- ✅ User B's profile has `store_id`

**Expected Results - Isolation:**
- ✅ User A cannot access User B's store admin
- ✅ User B cannot access User A's store admin
- ✅ Each store is independent

**Test Result:** [ ] PASS [ ] FAIL

---

## Test Suite 6: Profile Update

### Test 6.1: User Profile Updated After Store Creation
**Objective:** Verify user profile is updated with store info

**Steps:**
1. Before store creation:
   - Check profile: `SELECT * FROM profiles WHERE id = 'user-uuid'`
   - Note: `store_id` is likely NULL, `role` might be 'user'

2. Create a store as this user

3. After store creation:
   - Check profile again

**Expected Results:**
- ✅ `store_id` is now set to the new store's ID
- ✅ `role` = `store_owner`
- ✅ `updated_at` timestamp is recent

**Database Check:**
```sql
SELECT id, email, store_id, role, created_at, updated_at
FROM profiles
WHERE id = 'user-uuid';
```

**Test Result:** [ ] PASS [ ] FAIL

---

### Test 6.2: Profile Created if Missing
**Objective:** Verify profile is created if it doesn't exist

**Steps:**
1. Create user account directly in auth (e.g., via Supabase dashboard)
2. Do NOT create profile manually
3. Login and create store

**Expected Results:**
- ✅ Store creation succeeds
- ✅ Profile is automatically created
- ✅ Profile has:
   - `store_id` set
   - `role` = `store_owner`
   - `email` set

**Database Check:**
```sql
SELECT * FROM profiles WHERE id = 'new-user-uuid';
```

**Test Result:** [ ] PASS [ ] FAIL

---

## Test Suite 7: Integration Tests

### Test 7.1: Complete User Journey - Free Plan
**Objective:** Full end-to-end test for free plan

**Steps:**
1. Start in incognito browser
2. Navigate to `/create-store`
3. Redirected to `/auth`
4. Click "Create Account"
5. Fill signup form:
   - Email: `e2e-free@example.com`
   - Password: `TestPass123`
   - Name: `E2E User`
   - Phone: `01012345678`
6. Click "Sign Up"
7. Auto-login occurs
8. Redirected to `/create-store`
9. Fill store form:
   - Store Name: `E2E Free Store`
   - Subdomain: `e2efreestore`
10. Click "Next - Choose Plan"
11. Select "Trial Plan"
12. Click "Create Store"

**Expected Results at Each Step:**
- ✅ Step 2: Login page loads
- ✅ Step 4: Signup form appears
- ✅ Step 7: Auto-login and redirect works
- ✅ Step 8: Create store form shows with read-only email
- ✅ Step 11: Plan selection works
- ✅ Step 12: Store created successfully
- ✅ Redirect to store: `http://e2efreestore.localhost:3000/`
- ✅ Store public page loads

**Test Result:** [ ] PASS [ ] FAIL

---

### Test 7.2: Complete User Journey - Paid Plan
**Objective:** Full end-to-end test for paid plan with payment

**Steps:**
1-10: Same as Test 7.1 but select "Monthly Plan" instead of "Trial"
11. Click "Proceed to Payment"
12. Redirected to payment gateway
13. Complete payment (use test card or simulation)

**Expected Results:**
- ✅ Steps 1-10: Same as Test 7.1
- ✅ Step 11: Payment gateway loads
- ✅ Step 13: After payment, return to site
- ✅ Store status = `pending_payment` (before payment confirmation)
- ✅ After payment processing: Store becomes `active`

**Test Result:** [ ] PASS [ ] FAIL

---

## Post-Testing Checklist

After all tests complete:

- [ ] Review test results
- [ ] Document any failures
- [ ] Check logs for errors
- [ ] Verify database consistency
- [ ] Run performance tests
- [ ] Test on multiple browsers
- [ ] Test on mobile devices
- [ ] Test with different timezone settings
- [ ] Run load tests if applicable
- [ ] Verify analytics/tracking
- [ ] Check email notifications (if applicable)
- [ ] Test with different plan configurations

---

## Known Limitations & Notes

1. **Password Management:** Users can still change passwords via `/auth/forgot-password` flow
2. **Email Change:** Email change should be done via account settings (separate from store creation)
3. **Multiple Stores:** Current implementation allows users to create multiple stores (can be restricted)
4. **Session Duration:** Session expires after 1 hour by default (Supabase setting)
5. **Payment Processing:** Actual payment processing depends on payment gateway integration

---

## Troubleshooting Guide

### Issue: User not redirected to `/create-store` after login
**Possible Causes:**
- `next` parameter is malformed or missing
- URL decoding failed
- Router.push() not working

**Solution:**
1. Check URL parameters: `?next=%2Fcreate-store`
2. Verify `searchParams.get('next')` returns correct value
3. Check browser console for errors

---

### Issue: Email field shows "[object Object]" or null
**Possible Causes:**
- Session not properly initialized
- `supabase.auth.getUser()` returned error
- User email is null in session

**Solution:**
1. Check browser console
2. Verify Supabase session is valid
3. Check user profile in database

---

### Issue: "User must be logged in" error when creating store
**Possible Causes:**
- Session cookie not sent in request
- Session expired
- Cookie domain mismatch

**Solution:**
1. Clear browser cookies and login again
2. Check cookie settings: `httpOnly`, `secure`, `sameSite`
3. Verify `same-site` is not blocking cookies

---

### Issue: Store created but profile not updated
**Possible Causes:**
- Profile doesn't exist
- Duplicate profile (from old flow)
- RLS policies blocking update

**Solution:**
1. Check if profile exists: `SELECT * FROM profiles WHERE id = 'user-uuid'`
2. Check RLS policies on profiles table
3. Check API logs for profile update errors

---

## Support & Questions

For issues or questions about the implementation:
1. Check IMPLEMENTATION_SUMMARY.md for technical details
2. Check VISUAL_FLOW_GUIDE.md for flow diagrams
3. Review code comments in source files
4. Check database logs for errors

