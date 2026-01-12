# خطة تحويل الموقع إلى منصة متعددة المتاجر - الطريقة السهلة
## Multi-Tenant Platform Implementation Plan - Easy Path-Based Approach

---

## 📋 نظرة عامة | Overview

**الهدف:** تحويل متجر Maka Store إلى منصة تسمح لأي شخص بإنشاء متجره الخاص  
**الطريقة:** استخدام مسارات URL مثل `domain.com/store/[slug]/`  
**المدة المتوقعة:** 4-6 أسابيع  
**مستوى الصعوبة:** متوسط

---

## 🎯 المميزات | Features

### للمستخدمين | For Users
- ✅ إنشاء متجر خاص في دقائق
- ✅ لوحة تحكم منفصلة لكل متجر
- ✅ رابط مخصص: `yourdomain.com/store/متجري/`
- ✅ تصميم قابل للتخصيص (لوجو، ألوان، إعدادات)
- ✅ إدارة منتجات ومبيعات مستقلة
- ✅ تقارير وإحصائيات خاصة

### للمنصة | For Platform
- ✅ نظام اشتراكات شهري
- ✅ عمولة على المبيعات
- ✅ إحصائيات شاملة لجميع المتاجر
- ✅ موافقة على المتاجر قبل التفعيل

---

## 🗄️ المرحلة 1: تعديلات قاعدة البيانات
## Phase 1: Database Schema

### 1.1 جدول المتاجر | Stores Table

```sql
-- إنشاء جدول المتاجر الرئيسي
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- معلومات أساسية
  slug TEXT UNIQUE NOT NULL, -- الرابط المخصص
  store_name TEXT NOT NULL,
  store_name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  
  -- الحالة والموافقة
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'cancelled')),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  
  -- خطة الاشتراك
  subscription_plan TEXT NOT NULL DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'pro', 'enterprise')),
  subscription_start_date TIMESTAMPTZ DEFAULT NOW(),
  subscription_end_date TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  
  -- التخصيص
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#10b981',
  custom_domain TEXT UNIQUE, -- للخطط المتقدمة
  
  -- معلومات التواصل
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  social_media JSONB DEFAULT '{}', -- {facebook, instagram, twitter, etc}
  
  -- الإعدادات
  settings JSONB DEFAULT '{
    "currency": "EGP",
    "language": "ar",
    "tax_enabled": false,
    "tax_rate": 0,
    "shipping_enabled": true,
    "cod_enabled": true,
    "online_payment_enabled": false
  }',
  
  -- نسبة العمولة
  commission_rate DECIMAL(5,2) DEFAULT 5.00, -- 5% عمولة افتراضية
  
  -- الإحصائيات
  total_products INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  
  -- التواريخ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_order_at TIMESTAMPTZ,
  
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$'), -- حروف صغيرة وأرقام وشرطات فقط
  CONSTRAINT valid_commission CHECK (commission_rate >= 0 AND commission_rate <= 100)
);

-- فهارس لتحسين الأداء
CREATE INDEX idx_stores_owner ON stores(owner_id);
CREATE INDEX idx_stores_slug ON stores(slug);
CREATE INDEX idx_stores_status ON stores(status);
CREATE INDEX idx_stores_subscription_plan ON stores(subscription_plan);

-- تحديث تلقائي لـ updated_at
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 1.2 ربط الجداول الحالية بالمتاجر

```sql
-- إضافة store_id للمنتجات
ALTER TABLE products 
ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
ADD COLUMN is_active BOOLEAN DEFAULT true;

CREATE INDEX idx_products_store ON products(store_id);

-- إضافة store_id للطلبات
ALTER TABLE orders 
ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;

CREATE INDEX idx_orders_store ON orders(store_id);

-- إضافة store_id للفئات
ALTER TABLE categories 
ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;

CREATE INDEX idx_categories_store ON categories(store_id);

-- إضافة store_id لإعدادات التصميم
ALTER TABLE design_settings 
ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;

CREATE INDEX idx_design_settings_store ON design_settings(store_id);

-- إضافة store_id لإعدادات المتجر
ALTER TABLE store_settings 
ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;

CREATE INDEX idx_store_settings_store ON store_settings(store_id);
```

### 1.3 سياسات الأمان Row Level Security

```sql
-- سياسات جدول المتاجر
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- المالك يرى متجره فقط
CREATE POLICY "Users can view their own stores"
  ON stores FOR SELECT
  USING (auth.uid() = owner_id);

-- المالك يستطيع تعديل متجره
CREATE POLICY "Users can update their own stores"
  ON stores FOR UPDATE
  USING (auth.uid() = owner_id);

-- أي مستخدم مسجل يستطيع إنشاء متجر
CREATE POLICY "Authenticated users can create stores"
  ON stores FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- الجميع يستطيع مشاهدة المتاجر النشطة
CREATE POLICY "Everyone can view active stores"
  ON stores FOR SELECT
  USING (status = 'active');

-- الأدمن يرى كل شيء
CREATE POLICY "Admins can view all stores"
  ON stores FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- تحديث سياسات المنتجات
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (
    is_active = true 
    AND EXISTS (
      SELECT 1 FROM stores 
      WHERE id = products.store_id 
      AND status = 'active'
    )
  );

CREATE POLICY "Store owners can manage their products"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE id = products.store_id
      AND owner_id = auth.uid()
    )
  );

-- سياسات مشابهة للطلبات
CREATE POLICY "Store owners can view their orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE id = orders.store_id
      AND owner_id = auth.uid()
    )
  );
```

### 1.4 جدول خطط الاشتراك

```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  
  -- السعر
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2), -- خصم على الاشتراك السنوي
  
  -- الحدود
  max_products INTEGER, -- NULL = غير محدود
  max_orders_per_month INTEGER,
  max_storage_mb INTEGER, -- مساحة الصور
  
  -- المميزات
  features JSONB DEFAULT '[]', -- قائمة المميزات
  custom_domain_enabled BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  analytics_enabled BOOLEAN DEFAULT true,
  api_access BOOLEAN DEFAULT false,
  
  -- العمولة
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- البيانات الأولية للخطط
INSERT INTO subscription_plans (name, name_ar, price_monthly, price_yearly, max_products, max_orders_per_month, max_storage_mb, features, commission_rate) VALUES
('free', 'مجاني', 0, 0, 10, 50, 100, 
 '["10 منتجات", "50 طلب شهرياً", "100 ميجا تخزين", "دعم فني عادي"]', 
 10.00),
 
('basic', 'أساسي', 99, 990, 100, 500, 1000,
 '["100 منتج", "500 طلب شهرياً", "1 جيجا تخزين", "دعم فني أولوية", "تقارير مفصلة"]',
 7.00),
 
('pro', 'احترافي', 299, 2990, NULL, NULL, 5000,
 '["منتجات غير محدودة", "طلبات غير محدودة", "5 جيجا تخزين", "دعم VIP", "نطاق مخصص", "API متقدم", "تحليلات AI"]',
 5.00),
 
('enterprise', 'مؤسسات', 999, 9990, NULL, NULL, 20000,
 '["كل مميزات Pro", "20 جيجا تخزين", "مدير حساب مخصص", "تكامل مخصص", "SLA مضمون"]',
 3.00);
```

### 1.5 جدول معاملات العمولة

```sql
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- المبالغ
  order_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  
  -- الحالة
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  
  -- ملاحظات
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commissions_store ON commissions(store_id);
CREATE INDEX idx_commissions_status ON commissions(status);
CREATE INDEX idx_commissions_created_at ON commissions(created_at);

-- دالة لحساب العمولة تلقائياً عند إنشاء طلب
CREATE OR REPLACE FUNCTION calculate_commission()
RETURNS TRIGGER AS $$
DECLARE
  store_commission_rate DECIMAL(5,2);
  commission_amt DECIMAL(10,2);
BEGIN
  -- الحصول على نسبة عمولة المتجر
  SELECT commission_rate INTO store_commission_rate
  FROM stores WHERE id = NEW.store_id;
  
  -- حساب العمولة
  commission_amt := NEW.total_amount * (store_commission_rate / 100);
  
  -- إدراج سجل العمولة
  INSERT INTO commissions (store_id, order_id, order_amount, commission_rate, commission_amount)
  VALUES (NEW.store_id, NEW.id, NEW.total_amount, store_commission_rate, commission_amt);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء Trigger
CREATE TRIGGER order_commission_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.payment_status = 'paid')
  EXECUTE FUNCTION calculate_commission();
```

---

## 📁 المرحلة 2: هيكلة الملفات
## Phase 2: Project Structure

### 2.1 الهيكل الجديد

```
src/
├── app/
│   ├── (platform)/              # الصفحات الرئيسية للمنصة
│   │   ├── page.tsx            # الصفحة الرئيسية للمنصة
│   │   ├── pricing/            # صفحة الأسعار
│   │   ├── features/           # صفحة المميزات
│   │   └── login/              # تسجيل الدخول
│   │
│   ├── dashboard/              # لوحة تحكم صاحب المتجر
│   │   ├── layout.tsx
│   │   ├── page.tsx            # نظرة عامة
│   │   ├── products/           # إدارة المنتجات
│   │   ├── orders/             # إدارة الطلبات
│   │   ├── settings/           # إعدادات المتجر
│   │   ├── analytics/          # التقارير
│   │   └── subscription/       # الاشتراك والفواتير
│   │
│   ├── admin/                  # لوحة تحكم الأدمن للمنصة
│   │   ├── stores/             # إدارة المتاجر
│   │   ├── users/              # إدارة المستخدمين
│   │   ├── subscriptions/      # إدارة الاشتراكات
│   │   └── commissions/        # العمولات
│   │
│   └── store/
│       └── [slug]/             # صفحات المتجر العام
│           ├── layout.tsx      # تصميم المتجر
│           ├── page.tsx        # الصفحة الرئيسية
│           ├── products/       # قائمة المنتجات
│           │   └── [id]/       # تفاصيل المنتج
│           ├── cart/           # السلة
│           ├── checkout/       # إتمام الطلب
│           └── about/          # من نحن
│
├── components/
│   ├── platform/               # مكونات المنصة الرئيسية
│   ├── dashboard/              # مكونات لوحة التحكم
│   └── storefront/             # مكونات واجهة المتجر
│
├── lib/
│   ├── store-context.ts        # Context للمتجر الحالي
│   └── subscription.ts         # وظائف الاشتراكات
│
└── services/
    ├── stores.service.ts       # خدمات المتاجر
    └── subscriptions.service.ts # خدمات الاشتراكات
```

---

## 💻 المرحلة 3: الكود البرمجي
## Phase 3: Code Implementation

### 3.1 Store Context

```typescript
// src/lib/store-context.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { Store } from '@/types/store'

interface StoreContextType {
  store: Store | null
  isLoading: boolean
  error: string | null
}

const StoreContext = createContext<StoreContextType>({
  store: null,
  isLoading: true,
  error: null
})

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const slug = params?.slug as string
  
  const [store, setStore] = useState<Store | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadStore() {
      if (!slug) return
      
      try {
        setIsLoading(true)
        const response = await fetch(`/api/stores/${slug}`)
        
        if (!response.ok) {
          throw new Error('Store not found')
        }
        
        const data = await response.json()
        setStore(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load store')
        setStore(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadStore()
  }, [slug])

  return (
    <StoreContext.Provider value={{ store, isLoading, error }}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => useContext(StoreContext)
```

### 3.2 Store Layout

```typescript
// src/app/store/[slug]/layout.tsx
import { StoreProvider } from '@/lib/store-context'
import { StoreHeader } from '@/components/storefront/store-header'
import { StoreFooter } from '@/components/storefront/store-footer'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const store = await getStore(params.slug)
  
  if (!store) {
    return {
      title: 'Store Not Found'
    }
  }

  return {
    title: store.store_name,
    description: store.description,
  }
}

async function getStore(slug: string) {
  const supabase = createClient()
  
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()
  
  return store
}

export default async function StoreLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  const store = await getStore(params.slug)
  
  if (!store) {
    notFound()
  }

  return (
    <StoreProvider>
      <div 
        className="min-h-screen flex flex-col"
        style={{
          '--primary-color': store.primary_color,
          '--secondary-color': store.secondary_color
        } as React.CSSProperties}
      >
        <StoreHeader />
        <main className="flex-1">
          {children}
        </main>
        <StoreFooter />
      </div>
    </StoreProvider>
  )
}
```

### 3.3 Store Home Page

```typescript
// src/app/store/[slug]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { ProductGrid } from '@/components/storefront/product-grid'
import { HeroSection } from '@/components/storefront/hero-section'

interface Props {
  params: { slug: string }
}

export default async function StorePage({ params }: Props) {
  const supabase = createClient()
  
  // جلب المتجر
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'active')
    .single()

  // جلب منتجات المتجر
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', store.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(12)

  // جلب الفئات
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('store_id', store.id)
    .order('name')

  return (
    <div className="container mx-auto px-4 py-8">
      <HeroSection store={store} />
      
      <section className="mt-12">
        <h2 className="text-3xl font-bold mb-6">
          أحدث المنتجات
        </h2>
        <ProductGrid products={products} />
      </section>
      
      <section className="mt-12">
        <h2 className="text-3xl font-bold mb-6">
          تصفح حسب الفئة
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories?.map(category => (
            <a
              key={category.id}
              href={`/store/${params.slug}/products?category=${category.id}`}
              className="p-6 border rounded-lg hover:shadow-lg transition"
            >
              <h3 className="font-semibold">{category.name}</h3>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
```

### 3.4 API Route للمتاجر

```typescript
// src/app/api/stores/[slug]/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const supabase = createClient()

  const { data: store, error } = await supabase
    .from('stores')
    .select(`
      *,
      owner:profiles(id, full_name, avatar_url)
    `)
    .eq('slug', params.slug)
    .eq('status', 'active')
    .single()

  if (error || !store) {
    return NextResponse.json(
      { error: 'Store not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(store)
}
```

### 3.5 Dashboard Store Creation

```typescript
// src/app/dashboard/create-store/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CreateStorePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    slug: '',
    store_name: '',
    store_name_ar: '',
    description: '',
    email: '',
    phone: '',
    subscription_plan: 'free'
  })

  async function checkSlugAvailability(slug: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .single()
    
    return !data // متاح إذا لم يكن موجود
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      
      // التحقق من توفر الـ slug
      const isAvailable = await checkSlugAvailability(formData.slug)
      if (!isAvailable) {
        alert('هذا الرابط محجوز بالفعل')
        setLoading(false)
        return
      }

      // إنشاء المتجر
      const { data: store, error } = await supabase
        .from('stores')
        .insert([{
          ...formData,
          owner_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single()

      if (error) throw error

      // إنشاء الإعدادات الافتراضية
      await supabase.from('store_settings').insert([{
        store_id: store.id
      }])

      await supabase.from('design_settings').insert([{
        store_id: store.id
      }])

      alert('تم إنشاء متجرك بنجاح! في انتظار الموافقة.')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error creating store:', error)
      alert('حدث خطأ أثناء إنشاء المتجر')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">إنشاء متجر جديد</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            رابط المتجر (Slug)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">yourdomain.com/store/</span>
            <input
              type="text"
              required
              pattern="[a-z0-9-]+"
              value={formData.slug}
              onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase()})}
              className="flex-1 px-4 py-2 border rounded-lg"
              placeholder="my-store"
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            حروف صغيرة وأرقام وشرطات فقط
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            اسم المتجر بالإنجليزية
          </label>
          <input
            type="text"
            required
            value={formData.store_name}
            onChange={(e) => setFormData({...formData, store_name: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            اسم المتجر بالعربية
          </label>
          <input
            type="text"
            value={formData.store_name_ar}
            onChange={(e) => setFormData({...formData, store_name_ar: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            وصف المتجر
          </label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            البريد الإلكتروني
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            رقم الهاتف
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            خطة الاشتراك
          </label>
          <select
            value={formData.subscription_plan}
            onChange={(e) => setFormData({...formData, subscription_plan: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="free">مجاني (10 منتجات)</option>
            <option value="basic">أساسي - 99 ج.م/شهر</option>
            <option value="pro">احترافي - 299 ج.م/شهر</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'جاري الإنشاء...' : 'إنشاء المتجر'}
        </button>
      </form>
    </div>
  )
}
```

---

## 🎨 المرحلة 4: التخصيص والتصميم
## Phase 4: Customization

### 4.1 نظام الألوان المخصصة

```typescript
// src/components/storefront/store-header.tsx
'use client'

import { useStore } from '@/lib/store-context'
import Link from 'next/link'
import Image from 'next/image'

export function StoreHeader() {
  const { store } = useStore()

  if (!store) return null

  return (
    <header 
      className="border-b"
      style={{
        backgroundColor: store.primary_color + '10' // شفافية 10%
      }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href={`/store/${store.slug}`} className="flex items-center gap-3">
            {store.logo_url && (
              <Image
                src={store.logo_url}
                alt={store.store_name}
                width={50}
                height={50}
                className="rounded-full"
              />
            )}
            <h1 className="text-2xl font-bold">
              {store.store_name_ar || store.store_name}
            </h1>
          </Link>

          <nav className="flex items-center gap-6">
            <Link 
              href={`/store/${store.slug}`}
              className="hover:text-primary transition"
            >
              الرئيسية
            </Link>
            <Link 
              href={`/store/${store.slug}/products`}
              className="hover:text-primary transition"
            >
              المنتجات
            </Link>
            <Link 
              href={`/store/${store.slug}/about`}
              className="hover:text-primary transition"
            >
              من نحن
            </Link>
            <Link 
              href={`/store/${store.slug}/cart`}
              className="bg-primary text-white px-4 py-2 rounded-lg"
              style={{ backgroundColor: store.primary_color }}
            >
              السلة
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
```

---

## 📊 المرحلة 5: لوحة التحكم
## Phase 5: Dashboard

### 5.1 نظرة عامة على المتجر

```typescript
// src/app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { RevenueChart } from '@/components/dashboard/revenue-chart'

export default async function DashboardPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // جلب متجر المستخدم
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!store) redirect('/dashboard/create-store')

  // جلب الإحصائيات
  const { data: stats } = await supabase.rpc('get_store_stats', {
    store_id: store.id
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          مرحباً بك في {store.store_name}
        </h1>
        <p className="text-gray-600">
          رابط متجرك: 
          <a 
            href={`/store/${store.slug}`}
            target="_blank"
            className="text-blue-600 mr-2"
          >
            yourdomain.com/store/{store.slug}
          </a>
        </p>
      </div>

      <StatsCards stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <RevenueChart storeId={store.id} />
        <RecentOrders storeId={store.id} />
      </div>
    </div>
  )
}
```

---

## 💰 المرحلة 6: نظام الاشتراكات
## Phase 6: Subscription System

### 6.1 صفحة الأسعار

```typescript
// src/app/pricing/page.tsx
import { createClient } from '@/lib/supabase/server'
import { PricingCard } from '@/components/platform/pricing-card'

export default async function PricingPage() {
  const supabase = createClient()
  
  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price_monthly')

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          اختر الخطة المناسبة لك
        </h1>
        <p className="text-xl text-gray-600">
          ابدأ مجاناً وانتقل للخطط المدفوعة عند الحاجة
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {plans?.map(plan => (
          <PricingCard key={plan.id} plan={plan} />
        ))}
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">مقارنة الخطط</h2>
        <div className="overflow-x-auto">
          <table className="w-full max-w-4xl mx-auto border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-4 text-right">الميزة</th>
                {plans?.map(plan => (
                  <th key={plan.id} className="p-4">{plan.name_ar}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-4 border-t">عدد المنتجات</td>
                {plans?.map(plan => (
                  <td key={plan.id} className="p-4 border-t text-center">
                    {plan.max_products || 'غير محدود'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 border-t">الطلبات الشهرية</td>
                {plans?.map(plan => (
                  <td key={plan.id} className="p-4 border-t text-center">
                    {plan.max_orders_per_month || 'غير محدود'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 border-t">مساحة التخزين</td>
                {plans?.map(plan => (
                  <td key={plan.id} className="p-4 border-t text-center">
                    {plan.max_storage_mb} MB
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 border-t">نسبة العمولة</td>
                {plans?.map(plan => (
                  <td key={plan.id} className="p-4 border-t text-center">
                    {plan.commission_rate}%
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

---

## ⚡ المرحلة 7: خطوات التنفيذ
## Phase 7: Implementation Steps

### الأسبوع 1: قاعدة البيانات
- [ ] تنفيذ جميع الجداول (stores, subscription_plans, commissions)
- [ ] إضافة store_id للجداول الحالية
- [ ] تطبيق Row Level Security
- [ ] إنشاء الـ Functions والـ Triggers
- [ ] اختبار قاعدة البيانات

### الأسبوع 2: الصفحات الأساسية
- [ ] إنشاء `app/store/[slug]/layout.tsx`
- [ ] إنشاء `app/store/[slug]/page.tsx`
- [ ] إنشاء Store Context
- [ ] إنشاء Store Header/Footer
- [ ] اختبار عرض المتجر

### الأسبوع 3: لوحة التحكم
- [ ] صفحة إنشاء متجر
- [ ] لوحة تحكم المتجر
- [ ] إدارة المنتجات حسب المتجر
- [ ] إدارة الطلبات حسب المتجر
- [ ] صفحة الإعدادات

### الأسبوع 4: نظام الاشتراكات
- [ ] صفحة الأسعار
- [ ] نظام الترقية/التخفيض
- [ ] تتبع الحدود (المنتجات، الطلبات)
- [ ] نظام العمولات
- [ ] الإشعارات

### الأسبوع 5-6: التحسينات والاختبار
- [ ] تحسين الأداء
- [ ] اختبار شامل
- [ ] إصلاح الأخطاء
- [ ] توثيق الكود
- [ ] الإطلاق التجريبي

---

## 🔒 الأمان Security

### نقاط مهمة:
1. ✅ Row Level Security على جميع الجداول
2. ✅ التحقق من ملكية المتجر قبل أي عملية
3. ✅ فلترة البيانات حسب store_id
4. ✅ التحقق من حدود الاشتراك
5. ✅ منع الوصول المباشر للبيانات

### مثال RLS:
```sql
-- المالك فقط يستطيع تعديل منتجاته
CREATE POLICY "Store owners can update products"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE id = products.store_id
      AND owner_id = auth.uid()
    )
  );
```

---

## 📈 التوسع المستقبلي
## Future Enhancements

### بعد النسخة الأولى:
1. **نطاقات مخصصة:** `mystore.com` بدلاً من `platform.com/store/mystore`
2. **تطبيق جوال:** للبائعين والمشترين
3. **نظام التقييمات:** تقييم المتاجر والمنتجات
4. **برنامج الأفلييت:** عمولات للمسوقين
5. **تحليلات متقدمة:** AI insights
6. **تكامل WhatsApp:** للطلبات والدعم
7. **نظام الكوبونات:** خصومات مخصصة
8. **Multi-language:** دعم لغات متعددة

---

## ❓ الأسئلة الشائعة
## FAQ

### س: كم متجر يمكن إنشاءه؟
ج: متجر واحد لكل مستخدم في النسخة الأولى، يمكن زيادته لاحقاً.

### س: ماذا يحدث عند انتهاء الاشتراك؟
ج: يتم تعليق المتجر (status = suspended) حتى يتم التجديد.

### س: كيف يتم دفع العمولات؟
ج: يتم حسابها تلقائياً عند كل عملية بيع، والدفع شهرياً عبر تحويل بنكي.

### س: هل يمكن نقل المنتجات من متجر لآخر؟
ج: نعم، من خلال لوحة تحكل الأدمن فقط.

---

## 📞 الدعم والتواصل
## Support

للأسئلة والاستفسارات:
- 📧 Email: support@platform.com
- 💬 WhatsApp: +20 XXX XXX XXXX
- 📚 الوثائق: docs.platform.com

---

**ملاحظة:** هذه خطة تفصيلية للطريقة السهلة (Path-based). التنفيذ يتطلب معرفة جيدة بـ Next.js و Supabase. يُنصح بالبدء خطوة بخطوة واختبار كل مرحلة قبل الانتقال للتالية.

**تاريخ آخر تحديث:** 7 يناير 2026
