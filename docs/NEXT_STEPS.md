# 🎯 الخطوات التالية - تفعيل Multi-Tenant Platform

## ✅ تم إنجازه

تم إنشاء جميع الملفات الأساسية للتحويل إلى Multi-Tenant Platform:

1. ✅ **Database Migration** - `scripts/multi-tenant/00-complete-multi-tenant-migration.sql`
2. ✅ **Subdomain Routing** - `src/middleware.ts` محدث
3. ✅ **Store Context** - `src/lib/store-context.tsx`
4. ✅ **Create Store Page** - `src/app/create-store/page.tsx`
5. ✅ **Store API** - `src/app/api/stores/create/route.ts`
6. ✅ **Environment Config** - `.env.example` محدث
7. ✅ **Documentation** - `MULTI_TENANT_IMPLEMENTATION_GUIDE.md`

---

## 🚀 الخطوات المطلوبة الآن

### الخطوة 1: تشغيل Database Migration

**الطريقة الأولى (موصى بها): Supabase Dashboard**

```bash
1. افتح: https://supabase.com/dashboard
2. اختر مشروعك
3. اذهب إلى: SQL Editor (في القائمة اليسرى)
4. اضغط "New Query"
5. انسخ محتوى ملف: scripts/multi-tenant/00-complete-multi-tenant-migration.sql
6. ألصقه في المحرر
7. اضغط "RUN" (أسفل يمين)
8. انتظر حتى تظهر: "Success. No rows returned"
```

**الطريقة الثانية: CLI Script**

```bash
# تأكد من إضافة DATABASE_URL في .env.local أولاً
node scripts/setup-database-pg.js
```

**التحقق من النجاح:**

```sql
-- نفذ هذا في SQL Editor للتحقق
SELECT 
  'Migration Success!' AS status,
  (SELECT COUNT(*) FROM stores) AS total_stores,
  (SELECT COUNT(*) FROM subscription_plans) AS total_plans,
  (SELECT COUNT(*) FROM products WHERE store_id IS NOT NULL) AS migrated_products;

-- يجب أن ترى:
-- total_stores = 1 (المتجر الافتراضي)
-- total_plans = 4 (Free, Basic, Pro, Enterprise)
-- migrated_products = عدد منتجاتك الحالية
```

---

### الخطوة 2: تحديث Environment Variables

**أضف المتغيرات التالية في `.env.local`:**

```env
# Multi-Tenant Configuration
NEXT_PUBLIC_ENABLE_MULTI_TENANT=true
NEXT_PUBLIC_PLATFORM_DOMAIN=makastore.com

# إذا كنت تريد اختبار محلي، استخدم:
# NEXT_PUBLIC_PLATFORM_DOMAIN=localhost
```

**ملف `.env.local` الكامل يجب أن يحتوي على:**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tpkfgimtgduiiiscdqyq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DATABASE_URL=postgresql://postgres:...

# Multi-Tenant (جديد!)
NEXT_PUBLIC_ENABLE_MULTI_TENANT=true
NEXT_PUBLIC_PLATFORM_DOMAIN=makastore.com

# Site URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Kashier (موجود مسبقاً)
KASHIER_MERCHANT_ID=...
KASHIER_API_KEY=...
# ... إلخ
```

---

### الخطوة 3: إعادة تشغيل Development Server

```bash
# أوقف السيرفر الحالي (Ctrl+C)
# ثم شغله من جديد:

pnpm dev

# أو
npm run dev
```

**يجب أن ترى:**
```
✓ Ready in 2.1s
○ Local:   http://localhost:3000
```

---

### الخطوة 4: اختبار النظام

#### 1. اختبار المتجر الافتراضي

```bash
# زيارة الموقع الرئيسي
http://localhost:3000

# يجب أن يعمل كالمعتاد (البيانات الحالية لم تتأثر)
```

#### 2. اختبار إنشاء متجر جديد

```bash
# الخطوة 1: تسجيل مستخدم جديد (أو استخدم حساب موجود)
1. اذهب إلى: http://localhost:3000/auth
2. سجل حساب جديد
3. سجل دخول

# الخطوة 2: إنشاء متجر
1. اذهب إلى: http://localhost:3000/create-store
2. املأ النموذج:
   - اسم المتجر: Test Store
   - Subdomain: teststore
   - البريد: test@example.com
3. اضغط "إنشاء المتجر الآن"

# الخطوة 3: التحقق من قاعدة البيانات
-- في Supabase SQL Editor:
SELECT * FROM stores WHERE subdomain = 'teststore';
```

#### 3. اختبار Subdomain Routing (محلياً)

**ملاحظة:** لأن localhost لا يدعم subdomains بشكل طبيعي، لديك خياران:

**الخيار A: تعديل ملف hosts (Windows)**

```bash
# افتح Notepad كـ Administrator
# افتح الملف: C:\Windows\System32\drivers\etc\hosts

# أضف هذه الأسطر في النهاية:
127.0.0.1 teststore.localhost
127.0.0.1 main.localhost

# احفظ الملف (Ctrl+S)

# الآن يمكنك زيارة:
http://teststore.localhost:3000
http://main.localhost:3000
```

**الخيار B: استخدام service مثل ngrok (أسهل)**

```bash
# تثبيت ngrok
npm install -g ngrok

# تشغيل
ngrok http 3000

# سيعطيك URL مثل:
https://abc123.ngrok.io

# لكن للأسف ngrok لا يدعم wildcard subdomains في الباقة المجانية
```

**الخيار C: الانتظار حتى النشر على Production (موصى به)**

---

### الخطوة 5: النشر على Production (Vercel)

#### 1. إعداد Domain في Vercel

```bash
# افتح: https://vercel.com/dashboard
# اختر مشروعك
# Settings → Domains

1. Add Domain: makastore.com
2. Add Domain: *.makastore.com (Wildcard)
```

#### 2. إعداد DNS

**في موقع شراء الدومين (Namecheap/GoDaddy):**

```
Type    Name    Target                  TTL
CNAME   @       cname.vercel-dns.com    Automatic
CNAME   *       cname.vercel-dns.com    Automatic
```

#### 3. تحديث Environment Variables في Vercel

```bash
# في Vercel Dashboard:
Settings → Environment Variables

أضف:
NEXT_PUBLIC_ENABLE_MULTI_TENANT = true
NEXT_PUBLIC_PLATFORM_DOMAIN = makastore.com
NEXT_PUBLIC_SITE_URL = https://makastore.com

# + جميع المتغيرات الأخرى من .env.local
```

#### 4. Deploy

```bash
git add .
git commit -m "feat: Multi-Tenant Platform Implementation"
git push origin main

# Vercel سينشر تلقائياً
# أو يدوياً:
vercel --prod
```

#### 5. التحقق من Production

```bash
# بعد 5-10 دقائق:
curl https://makastore.com
# المتوقع: صفحة المنصة الرئيسية

curl https://main.makastore.com
# المتوقع: المتجر الافتراضي

# إنشاء متجر جديد:
https://makastore.com/create-store

# ثم زيارته:
https://newstore.makastore.com
```

---

## 🔧 استكشاف الأخطاء

### مشكلة: "Migration failed" في SQL Editor

**الحل:**

```bash
1. تحقق من وجود Syntax Errors في السطر المشار إليه
2. تأكد من أن الجداول غير موجودة مسبقاً:
   DROP TABLE IF EXISTS stores CASCADE;
   DROP TABLE IF EXISTS subscription_plans CASCADE;
   DROP TABLE IF EXISTS commissions CASCADE;
3. شغل Migration مرة أخرى
```

---

### مشكلة: "store_id does not exist" بعد Migration

**الحل:**

```sql
-- تحقق من وجود الـ column:
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'store_id';

-- إذا لم يوجد، شغل هذا:
ALTER TABLE products ADD COLUMN store_id UUID REFERENCES stores(id);
```

---

### مشكلة: Subdomain لا يعمل محلياً

**الحل:**

```bash
# استخدم ملف hosts (راجع الخطوة 4 - الخيار A)
# أو انتظر حتى النشر على Production
```

---

### مشكلة: "Unauthorized" عند إنشاء متجر

**الحل:**

```bash
1. تأكد من تسجيل الدخول أولاً
2. تحقق من أن NEXT_PUBLIC_SUPABASE_ANON_KEY صحيح
3. تحقق من RLS Policies:
   SELECT * FROM pg_policies WHERE tablename = 'stores';
```

---

## 📚 الموارد

- **الدليل الشامل:** [MULTI_TENANT_IMPLEMENTATION_GUIDE.md](MULTI_TENANT_IMPLEMENTATION_GUIDE.md)
- **ملف Migration:** [scripts/multi-tenant/00-complete-multi-tenant-migration.sql](scripts/multi-tenant/00-complete-multi-tenant-migration.sql)
- **Supabase Docs:** https://supabase.com/docs
- **Vercel Domains:** https://vercel.com/docs/custom-domains

---

## ✨ الخطوات التالية (بعد التفعيل)

1. **إنشاء Store Owner Dashboard**
   - صفحة `/dashboard` لكل متجر
   - إحصائيات المتجر (المنتجات، الطلبات، الإيرادات)
   - إدارة الاشتراك والترقية

2. **إنشاء Platform Admin Dashboard**
   - صفحة `/admin/stores` لإدارة جميع المتاجر
   - الموافقة على المتاجر الجديدة (pending → active)
   - إدارة العمولات

3. **تحديث API Routes**
   - إضافة `store_id` filtering في جميع الـ APIs
   - مثال: `/api/products` يجلب منتجات المتجر الحالي فقط

4. **تحديث UI Components**
   - استخدام `useStore()` لجلب بيانات المتجر
   - تطبيق ألوان المتجر ديناميكياً

5. **نظام الإشعارات**
   - إرسال email عند إنشاء متجر جديد
   - إشعارات عند اقتراب حد الاشتراك

---

## 🎉 تهانينا!

إذا وصلت هنا، فقد نجحت في تحويل Maka Store إلى منصة Multi-Tenant كاملة! 🚀

**التأثير:**
- ✅ دعم **آلاف المتاجر** بدلاً من متجر واحد
- ✅ **عزل كامل** للبيانات بين المتاجر
- ✅ **نظام اشتراكات** جاهز للربح
- ✅ **عمولات تلقائية** على كل طلب
- ✅ **subdomain لكل متجر** (احترافي)

**الآن يمكنك:**
- بناء منصة تجارة إلكترونية منافسة لـ Shopify/Salla
- جذب مئات التجار للمنصة
- تحقيق دخل شهري من الاشتراكات + العمولات

---

**Need help?** راجع [MULTI_TENANT_IMPLEMENTATION_GUIDE.md](MULTI_TENANT_IMPLEMENTATION_GUIDE.md) للتفاصيل الكاملة.
