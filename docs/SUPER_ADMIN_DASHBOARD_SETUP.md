# Super Admin Dashboard Setup Guide
# دليل إعداد لوحة تحكم Super Admin

## 📋 Overview | نظرة عامة

تم إنشاء نظام Super Admin Dashboard كامل يسمح بإدارة جميع المتاجر من مكان واحد.

## ✨ Features | الميزات

### 1. Super Admin Dashboard
- **Path**: `/super-admin`
- **Protection**: محمية فقط لـ `super_admin` role
- **Features**:
  - 📊 إحصائيات شاملة لكل المتاجر
  - 👀 عرض جميع المتاجر في جدول
  - 🔍 بحث وفلترة المتاجر
  - ✅ تفعيل/تعطيل المتاجر
  - 🗑️ حذف المتاجر
  - 👁️ عرض المتجر في نافذة جديدة
  - 📈 إحصائيات لكل متجر (منتجات، طلبات، إيرادات)

### 2. Create Store Page Protection
- **Path**: `/create-store`
- **Old**: كان متاح للجميع
- **New**: محمية فقط لـ `super_admin` role
- يمكن للـ Super Admin فقط إنشاء متاجر جديدة

## 🚀 Installation Steps | خطوات التنصيب

### Step 1: تشغيل SQL Script

افتح Supabase SQL Editor وشغّل الملف:
```
scripts/multi-tenant/ADD-SUPER-ADMIN-ROLE.sql
```

هذا الـ script هيعمل:
- ✅ إضافة/تعديل `role` column في جدول `profiles`
- ✅ إنشاء function للتحقق من Super Admin: `is_super_admin()`
- ✅ إضافة RLS Policies للـ Super Admin
- ✅ إنشاء View للإحصائيات: `stores_statistics`

### Step 2: إنشاء Super Admin User

#### 2.1 الحصول على User ID
```sql
-- في Supabase SQL Editor
SELECT id, email FROM auth.users;
```

#### 2.2 تعيين role كـ super_admin
```sql
-- استبدل YOUR-USER-UUID-HERE بالـ UUID من الخطوة السابقة
UPDATE public.profiles
SET role = 'super_admin'
WHERE id = 'YOUR-USER-UUID-HERE';
```

#### 2.3 التحقق
```sql
SELECT id, name, email, role 
FROM public.profiles 
WHERE role = 'super_admin';
```

### Step 3: الوصول للـ Dashboard

1. سجل دخول بالـ user اللي عملته super_admin
2. روح على: `https://xfuse.online/super-admin`
3. أو في الـ local: `http://localhost:3000/super-admin`

## 🔐 Security | الأمان

### Middleware Protection
تم إضافة حماية في `src/middleware.ts`:

```typescript
// Super admin only paths
const SUPER_ADMIN_PATHS = new Set([
  "/super-admin",
  "/create-store",
])
```

### Authorization Flow
1. المستخدم يحاول الوصول لـ `/super-admin` أو `/create-store`
2. Middleware يتحقق من تسجيل الدخول
3. إذا لم يكن مسجل دخول → Redirect to `/admin/login`
4. يتحقق من `role` في جدول `profiles`
5. إذا لم يكن `super_admin` → Redirect to `/`
6. إذا كان `super_admin` → يسمح بالوصول ✅

### RLS Policies
تم إضافة policies في Supabase:

- `super_admin_view_all_stores`: عرض جميع المتاجر
- `super_admin_update_all_stores`: تعديل أي متجر
- `super_admin_delete_stores`: حذف المتاجر
- `super_admin_view_all_profiles`: عرض جميع الـ profiles

## 📊 Dashboard Features Details | تفاصيل الميزات

### Statistics Cards | بطاقات الإحصائيات
1. **إجمالي المتاجر**: عدد كل المتاجر
2. **المتاجر النشطة**: المتاجر الـ `is_active = true`
3. **المتاجر المعطلة**: المتاجر الـ `is_active = false`
4. **إجمالي الطلبات**: مجموع طلبات كل المتاجر
5. **إجمالي الإيرادات**: مجموع الإيرادات من الطلبات المكتملة
6. **إجمالي المنتجات**: عدد كل المنتجات في كل المتاجر

### Stores Table | جدول المتاجر
يعرض لكل متجر:
- اسم المتجر
- Subdomain
- البريد الإلكتروني
- عدد المنتجات
- عدد الطلبات
- الإيرادات
- الحالة (نشط/معطل)
- تاريخ الإنشاء

### Actions | الإجراءات
- **عرض**: فتح المتجر في نافذة جديدة
- **تفعيل/تعطيل**: تبديل حالة المتجر
- **حذف**: حذف المتجر نهائياً (مع تأكيد)

### Search | البحث
يمكنك البحث عن متجر بـ:
- اسم المتجر
- Subdomain
- البريد الإلكتروني

## 🎨 UI Components Used | المكونات المستخدمة

من shadcn/ui:
- `Card` - البطاقات
- `Table` - الجدول
- `Button` - الأزرار
- `Badge` - الحالة (نشط/معطل)
- `Input` - البحث
- `Dialog` - نافذة التأكيد للحذف
- `Label`, `Textarea` - (للتعديل المستقبلي)

Icons من `lucide-react`:
- `Store`, `Settings`, `Users`, `TrendingUp`, `DollarSign`
- `Eye`, `Edit`, `Trash2`, `Plus`, `Search`, `RefreshCw`
- `CheckCircle`, `XCircle`

## 🔄 Data Flow | تدفق البيانات

```
User Access
    ↓
Middleware Check (super_admin role)
    ↓
Dashboard Page Load
    ↓
Fetch Stores from Supabase
    ↓
For Each Store:
    - Count Products
    - Count Orders
    - Calculate Revenue
    ↓
Calculate Overall Statistics
    ↓
Display in Dashboard
```

## 🛠️ Future Enhancements | تحسينات مستقبلية

يمكنك إضافة:
- [ ] تعديل بيانات المتجر من الـ Dashboard
- [ ] إحصائيات متقدمة (رسوم بيانية)
- [ ] تصدير تقارير Excel/PDF
- [ ] إدارة Subscription Plans
- [ ] إدارة Commissions
- [ ] عرض العملاء والـ Orders لكل متجر
- [ ] إشعارات في الوقت الفعلي
- [ ] Activity Logs لتتبع التغييرات

## 🐛 Troubleshooting | حل المشاكل

### مشكلة: لا يمكن الوصول للـ Dashboard
**الحل**:
1. تأكد من تشغيل SQL script
2. تأكد من تعيين role = 'super_admin' في profiles
3. تحقق من تسجيل الدخول
4. تحقق من الـ browser console للأخطاء

### مشكلة: البيانات لا تظهر
**الحل**:
1. تحقق من RLS Policies في Supabase
2. تحقق من الـ Network tab في Developer Tools
3. تأكد من وجود `NEXT_PUBLIC_SUPABASE_URL` و `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### مشكلة: Cannot delete store
**الحل**:
- قد يكون المتجر يحتوي على foreign key constraints
- احذف البيانات المرتبطة أولاً أو استخدم `ON DELETE CASCADE`

## 📝 Roles Hierarchy | تسلسل الأدوار

```
super_admin (أعلى صلاحية)
    ↓
    - إدارة جميع المتاجر
    - إنشاء متاجر جديدة
    - تفعيل/تعطيل/حذف المتاجر
    - عرض جميع الإحصائيات

store_owner (صاحب متجر)
    ↓
    - إدارة متجر واحد فقط
    - لا يمكنه رؤية المتاجر الأخرى

admin (مدير متجر)
    ↓
    - إدارة متجر معين
    - صلاحيات محدودة

user (عميل)
    ↓
    - الشراء فقط
```

## 🎯 Files Modified/Created | الملفات المعدلة/المنشأة

### Created:
1. `src/app/super-admin/page.tsx` - صفحة Super Admin Dashboard
2. `scripts/multi-tenant/ADD-SUPER-ADMIN-ROLE.sql` - SQL setup script

### Modified:
1. `src/middleware.ts` - إضافة حماية للـ Super Admin paths
2. `.env.local` - تحديث الدومين لـ xfuse.online

## 🌐 Deployment | النشر

### على Vercel:
1. تأكد من تشغيل SQL script في Supabase
2. Deploy الكود
3. تأكد من Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_PLATFORM_DOMAIN=xfuse.online`

### على Custom Domain:
- الدومين الحالي: `xfuse.online`
- Super Admin Dashboard: `https://xfuse.online/super-admin`
- Create Store: `https://xfuse.online/create-store`

## ✅ Testing Checklist | قائمة الاختبار

- [ ] SQL script نفذ بنجاح
- [ ] Super admin user تم إنشاؤه
- [ ] يمكن الوصول لـ `/super-admin`
- [ ] الإحصائيات تظهر بشكل صحيح
- [ ] جدول المتاجر يعرض البيانات
- [ ] البحث يعمل
- [ ] تفعيل/تعطيل يعمل
- [ ] حذف المتجر يعمل (مع التأكيد)
- [ ] عرض المتجر يفتح في نافذة جديدة
- [ ] غير Super Admin لا يمكنه الوصول
- [ ] `/create-store` محمية بشكل صحيح

## 🎉 Done! | تم!

الآن عندك Super Admin Dashboard كامل يمكنك من:
- 👀 مراقبة جميع المتاجر
- 📊 عرض الإحصائيات الشاملة
- ⚡ إدارة المتاجر بسرعة
- 🔐 حماية كاملة بـ RLS + Middleware

---

**Created by**: GitHub Copilot
**Date**: January 12, 2026
**Version**: 1.0.0
