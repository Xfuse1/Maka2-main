# 🚀 Deployment Guide - دليل النشر
## Deploy to Vercel with Custom Domain

---

## ⚠️ CRITICAL: Do These Steps IN ORDER!

### Step 1: Add Environment Variables to Vercel (FIRST!)
**يجب إضافة المتغيرات قبل الـ Deploy!**

1. Go to: https://vercel.com/your-username/maka-store01/settings/environment-variables
2. Add these variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://dowvlportioymixpsnie.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Domain
NEXT_PUBLIC_PLATFORM_DOMAIN=xfuse.online
NEXT_PUBLIC_BASE_URL=https://xfuse.online

# Admin
ADMIN_SECRET_CODE=mecca-admin-2024

# Payment (if you have Kashier)
KASHIER_API_URL=https://checkout.kashier.io
KASHIER_MERCHANT_ID=your-merchant-id
KASHIER_API_KEY=your-api-key
KASHIER_TEST_MODE=true
```

**⚠️ Important**: Make sure to check "Production", "Preview", and "Development" for each variable!

---

### Step 2: Deploy to Vercel

```powershell
# In your terminal:
cd D:\Maka2-main\Maka2-main
vercel --prod
```

✅ This will deploy your site to Vercel!

---

### Step 3: Add Custom Domain in Vercel Dashboard

1. Go to: https://vercel.com/your-username/maka-store01/settings/domains
2. Click "Add Domain"
3. Enter: `xfuse.online`
4. Click "Add"
5. Click "Add Domain" again
6. Enter: `*.xfuse.online` (wildcard for subdomains)
7. Click "Add"

Vercel will show you DNS records to configure.

---

### Step 4: Configure DNS in GoDaddy

#### 4.1 Main Domain (xfuse.online)
1. Go to GoDaddy → My Products → Domains → xfuse.online → DNS
2. Add/Edit these records:

**A Record:**
```
Type: A
Name: @
Value: 76.76.19.19
TTL: 600 seconds
```

#### 4.2 Wildcard Subdomain (*.xfuse.online)
**CNAME Record:**
```
Type: CNAME
Name: *
Value: cname.vercel-dns.com
TTL: 600 seconds
```

#### 4.3 WWW Subdomain (optional)
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 600 seconds
```

---

### Step 5: Wait for DNS Propagation
⏰ **DNS changes take 5-30 minutes to propagate**

Check status:
- https://www.whatsmydns.net/#A/xfuse.online
- https://www.whatsmydns.net/#CNAME/*.xfuse.online

---

### Step 6: Verify Deployment

1. **Main domain**: https://xfuse.online
   - Should show your homepage

2. **Super Admin**: https://xfuse.online/super-admin
   - Login with super_admin account

3. **Create Store**: https://xfuse.online/create-store
   - Create a new store (e.g., subdomain: `store1`)

4. **Store subdomain**: https://store1.xfuse.online
   - Should show the store homepage

5. **Another store**: https://w12.xfuse.online
   - Your existing store should work now!

---

## 🔧 Troubleshooting

### Issue 1: "This site can't be reached" (ERR_CONNECTION_CLOSED)
**Cause**: Domain not added to Vercel OR DNS not configured

**Solution**:
1. Make sure you added `*.xfuse.online` to Vercel domains
2. Check DNS records in GoDaddy
3. Wait 10-30 minutes for DNS propagation
4. Clear browser cache: Ctrl+Shift+Delete

---

### Issue 2: "404 - Page Not Found"
**Cause**: Vercel deployment successful but routing issue

**Solution**:
1. Check middleware.ts is handling subdomains
2. Verify environment variables are set in Vercel
3. Redeploy: `vercel --prod`

---

### Issue 3: "Internal Server Error" (500)
**Cause**: Missing environment variables

**Solution**:
1. Go to Vercel → Settings → Environment Variables
2. Make sure ALL variables are set
3. Redeploy: `vercel --prod`

---

### Issue 4: Subdomain works but data is wrong
**Cause**: Store isolation not working

**Solution**:
1. Check if you ran SQL scripts in Supabase:
   - `scripts/multi-tenant/FIX-INFINITE-RECURSION.sql`
   - `scripts/multi-tenant/CREATE-MISSING-PROFILES.sql`
2. Verify `store_id` exists in profiles table
3. Check middleware is extracting subdomain correctly

---

## 📋 Complete Checklist

Before going live, verify:

- [ ] Environment variables added to Vercel (ALL of them!)
- [ ] Code deployed to Vercel (`vercel --prod`)
- [ ] `xfuse.online` added to Vercel domains
- [ ] `*.xfuse.online` added to Vercel domains
- [ ] DNS A record configured in GoDaddy
- [ ] DNS CNAME wildcard configured in GoDaddy
- [ ] DNS propagated (check whatsmydns.net)
- [ ] SQL scripts executed in Supabase
- [ ] Super admin account created
- [ ] Main domain works: https://xfuse.online
- [ ] Super admin works: https://xfuse.online/super-admin
- [ ] Subdomains work: https://store1.xfuse.online

---

## 🎯 Quick Deploy Commands

```powershell
# 1. Build locally to check for errors
npm run build

# 2. Deploy to Vercel
vercel --prod

# 3. Check deployment status
vercel ls

# 4. View logs
vercel logs
```

---

## 🌐 URLs After Deployment

| Type | URL | Purpose |
|------|-----|---------|
| Main Site | https://xfuse.online | Homepage/landing |
| Super Admin | https://xfuse.online/super-admin | Manage all stores |
| Create Store | https://xfuse.online/create-store | Create new store |
| Store 1 | https://store1.xfuse.online | First store |
| Store 2 | https://w12.xfuse.online | Your created store |
| Admin Login | https://store1.xfuse.online/admin/login | Store admin |

---

## ⚡ Fast Track (If in hurry)

```powershell
# 1. Add env vars in Vercel dashboard (can't skip this!)

# 2. Deploy
cd D:\Maka2-main\Maka2-main
vercel --prod

# 3. Add domains in Vercel:
#    - xfuse.online
#    - *.xfuse.online

# 4. Add DNS in GoDaddy:
#    A record: @ → 76.76.19.19
#    CNAME: * → cname.vercel-dns.com

# 5. Wait 10 minutes

# 6. Test: https://w12.xfuse.online
```

---

**Created**: January 12, 2026
**Last Updated**: January 12, 2026
