# 🔐 Dynamic Kashier Payment Settings
## نظام إدارة إعدادات Kashier بشكل ديناميكي لكل متجر

---

## 📋 نظرة عامة

تم إضافة نظام كامل يسمح لكل صاحب متجر بإدارة بيانات **Kashier Payment Gateway** الخاصة به من لوحة التحكم، مع **تشفير كامل** للبيانات الحساسة.

---

## ✅ الملفات المضافة/المعدلة

### 1️⃣ SQL Script
📁 `scripts/multi-tenant/ADD-KASHIER-PAYMENT-SETTINGS.sql`
- إضافة columns جديدة في `store_settings`:
  - `kashier_merchant_id` (TEXT)
  - `kashier_api_key` (TEXT - مشفر)
  - `kashier_test_mode` (BOOLEAN)
  - `kashier_webhook_secret` (TEXT - مشفر)
  - `kashier_enabled` (BOOLEAN)

### 2️⃣ Admin Page
📁 `src/app/admin/payment-settings/page.tsx`
- صفحة كاملة لإدارة إعدادات Kashier
- واجهة سهلة بـ shadcn/ui
- عرض/إخفاء API Keys
- Test/Live Mode toggle
- حفظ مع تشفير تلقائي

### 3️⃣ API Route
📁 `src/app/api/admin/payment-settings/route.ts`
- **GET**: استرجاع إعدادات Kashier (مع فك التشفير)
- **POST**: حفظ إعدادات Kashier (مع التشفير)
- التحقق من الـ store_id تلقائياً
- Validation للبيانات المطلوبة

### 4️⃣ Kashier Config (Updated)
📁 `src/services/payment/kashier-config.ts`
- ✅ **جديد**: `getKashierConfigForStore(storeId)` - يجلب الإعدادات من DB
- ✅ **Fallback**: `getKashierConfigFromEnv()` - يستخدم environment variables
- ✅ **Encryption**: فك تشفير API Keys تلقائياً

### 5️⃣ Kashier Adapter (Updated)
📁 `src/services/payment/kashier-adapter.ts`
- يقبل `storeId` في الـ parameters
- يستخدم store-specific config إذا توفر
- Backward compatible مع الكود القديم

### 6️⃣ Payment Service (Updated)
📁 `src/services/payment/payment-service.ts`
- `initiateKashierPayment()` يستقبل `storeId`
- يجلب الـ config من DB أولاً
- Fallback لـ env variables

### 7️⃣ Payment API (Updated)
📁 `src/app/api/payment/create/route.ts`
- يحصل على `storeId` من الـ subdomain
- يمرره للـ payment service
- استخدام تلقائي للـ keys الصحيحة

### 8️⃣ Admin Sidebar (Updated)
📁 `src/components/admin/admin-sidebar.tsx`
- إضافة رابط "إعدادات الدفع" في القائمة
- أيقونة CreditCard

### 9️⃣ Environment Variables (Updated)
📁 `.env.example`
- إضافة `ENCRYPTION_KEY` (32 حرف)
- توضيح أن Kashier env vars أصبحت اختيارية (fallback)

---

## 🚀 خطوات التفعيل

### 1️⃣ تنفيذ SQL Script
```sql
-- في Supabase SQL Editor
-- نفذ الملف: scripts/multi-tenant/ADD-KASHIER-PAYMENT-SETTINGS.sql
```

### 2️⃣ إضافة ENCRYPTION_KEY في .env
```bash
# يجب أن يكون 32 حرف بالضبط
ENCRYPTION_KEY=your-32-character-secret-key!!
```

💡 **لتوليد مفتاح آمن:**
```bash
# Linux/Mac
openssl rand -hex 16

# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### 3️⃣ إعادة تشغيل السيرفر
```bash
npm run dev
```

### 4️⃣ إعداد Kashier لكل متجر
1. افتح `http://yourstore.localhost:3000/admin/payment-settings`
2. فعّل Kashier
3. أدخل **Merchant ID** و **API Key**
4. اختر **Test Mode** أو **Live Mode**
5. احفظ الإعدادات ✅

---

## 🔒 الأمان

### التشفير
- ✅ جميع API Keys يتم **تشفيرها** قبل الحفظ في DB
- ✅ استخدام **AES-256-CBC** encryption
- ✅ فك التشفير يحدث فقط في الـ server-side
- ✅ لا يتم إرسال keys مشفرة للـ client

### Isolation
- ✅ كل متجر يرى إعداداته **فقط**
- ✅ API يستخدم `getStoreIdFromRequest()` للتحقق
- ✅ لا يمكن الوصول لإعدادات متجر آخر

---

## 📖 كيفية الاستخدام

### للمطور
```typescript
// في أي API route
import { getKashierConfigForStore } from "@/services/payment/kashier-config"

const config = await getKashierConfigForStore(storeId)
// {
//   merchantId: "MID-XXX-XXX",
//   apiKey: "decrypted-key",
//   testMode: true,
//   enabled: true
// }
```

### لصاحب المتجر
1. اذهب إلى **إعدادات الدفع** في لوحة التحكم
2. فعّل Kashier
3. أدخل بيانات حسابك من [Kashier Dashboard](https://merchants.kashier.io)
4. احفظ ✅
5. الآن الدفع يعمل بإعداداتك الخاصة

---

## 🔄 Backward Compatibility

النظام **متوافق تماماً** مع الكود القديم:

- ✅ إذا لم يتم إدخال keys في DB، يستخدم **environment variables**
- ✅ الكود القديم يعمل بدون تعديلات
- ✅ يمكن الترحيل تدريجياً

---

## 🧪 الاختبار

### Test Mode
- ✅ يستخدم Kashier Sandbox
- ✅ لا يتم خصم أموال حقيقية
- ✅ مناسب للتجربة

### Live Mode
- ⚠️ يستخدم Kashier Production
- 💰 يتم خصم أموال حقيقية
- ✅ للإنتاج فقط

---

## 🎯 الفوائد

1. ✅ **كل متجر مستقل** - له بيانات Kashier خاصة
2. ✅ **أمان عالي** - تشفير كامل للبيانات الحساسة
3. ✅ **سهولة الإدارة** - واجهة بسيطة من Admin Panel
4. ✅ **مرونة** - Test/Live mode لكل متجر
5. ✅ **توافق** - يعمل مع الكود الحالي بدون مشاكل

---

## 🐛 استكشاف الأخطاء

### المفتاح ENCRYPTION_KEY غير موجود
**الحل**: أضف `ENCRYPTION_KEY=your-32-char-key` في `.env.local`

### الإعدادات لا تُحفظ
**الحل**: تأكد من تنفيذ SQL script أولاً

### Payment يستخدم env vars بدلاً من DB
**الحل**: تأكد من:
- Kashier enabled في Admin Panel
- Merchant ID و API Key مُدخلين بشكل صحيح
- السيرفر مُعاد تشغيله

### خطأ في فك التشفير
**الحل**: تأكد أن `ENCRYPTION_KEY` نفسه في production و development

---

## 📞 الدعم

إذا كان عندك أي مشكلة، تحقق من:
1. Console logs في الـ terminal
2. Network tab في DevTools
3. Supabase Logs

---

**صُنع بـ ❤️ لمنصة Maka2 متعددة المتاجر**
