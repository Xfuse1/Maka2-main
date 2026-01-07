-- =============================================================================
-- Fix RLS Policies and Initial Data
-- إصلاح سياسات RLS وإضافة البيانات الأولية
-- =============================================================================
-- Run this in Supabase SQL Editor to fix authentication and permissions issues
-- قم بتشغيل هذا في Supabase SQL Editor لإصلاح مشاكل الصلاحيات والمصادقة
-- =============================================================================

-- =============================================================================
-- 1. Fix Store Settings RLS Policies
-- إصلاح سياسات RLS لإعدادات المتجر
-- =============================================================================

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Public can read store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Public can view store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admins can update store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admins can manage store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Service role can do anything on store_settings" ON public.store_settings;
DROP POLICY IF EXISTS "public read settings" ON public.store_settings;
DROP POLICY IF EXISTS "admin update settings" ON public.store_settings;
DROP POLICY IF EXISTS "admin insert settings" ON public.store_settings;

-- الجميع يمكنهم قراءة إعدادات المتجر
CREATE POLICY "Anyone can read store settings" 
ON public.store_settings
FOR SELECT 
USING (true);

-- المسؤولون يمكنهم إدارة الإعدادات
CREATE POLICY "Admins can manage store settings" 
ON public.store_settings
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Service role يمكنه فعل أي شيء (للـ backend APIs)
CREATE POLICY "Service role full access on store_settings" 
ON public.store_settings
FOR ALL 
USING (true)
WITH CHECK (true);

-- =============================================================================
-- 2. Fix Page Content RLS Policies
-- إصلاح سياسات RLS لمحتوى الصفحات
-- =============================================================================

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Public can view published pages" ON public.page_content;
DROP POLICY IF EXISTS "Admins can view all pages" ON public.page_content;
DROP POLICY IF EXISTS "Admins can manage pages" ON public.page_content;
DROP POLICY IF EXISTS "Admins can insert pages" ON public.page_content;
DROP POLICY IF EXISTS "Admins can update pages" ON public.page_content;
DROP POLICY IF EXISTS "Admins can delete pages" ON public.page_content;
DROP POLICY IF EXISTS "Service role can do anything on page_content" ON public.page_content;

-- الجميع يمكنهم قراءة الصفحات المنشورة
CREATE POLICY "Anyone can view published pages" 
ON public.page_content
FOR SELECT 
USING (is_published = true);

-- المسؤولون يمكنهم قراءة جميع الصفحات
CREATE POLICY "Admins can view all pages" 
ON public.page_content
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- المسؤولون يمكنهم إضافة صفحات
CREATE POLICY "Admins can insert pages" 
ON public.page_content
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- المسؤولون يمكنهم تعديل الصفحات
CREATE POLICY "Admins can update pages" 
ON public.page_content
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- المسؤولون يمكنهم حذف الصفحات
CREATE POLICY "Admins can delete pages" 
ON public.page_content
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Service role يمكنه فعل أي شيء (للـ backend APIs)
CREATE POLICY "Service role full access on page_content" 
ON public.page_content
FOR ALL 
USING (true)
WITH CHECK (true);

-- =============================================================================
-- 3. Insert Initial Store Settings (if not exists)
-- إضافة الإعدادات الأولية للمتجر (إذا لم تكن موجودة)
-- =============================================================================

-- حذف البيانات القديمة إن وجدت
DELETE FROM public.store_settings WHERE id = '00000000-0000-0000-0000-000000000001';

-- إضافة الإعدادات الافتراضية
INSERT INTO public.store_settings (
  id, 
  store_name, 
  store_description,
  shipping_fee,
  free_shipping_threshold,
  tax_rate,
  currency,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'متجري الإلكتروني',
  'متجر إلكتروني متكامل لبيع المنتجات',
  50.00,
  500.00,
  0.00,
  'EGP',
  NOW()
);

-- =============================================================================
-- 4. Insert Initial Design Settings (if not exists)
-- إضافة إعدادات التصميم الأولية (إذا لم تكن موجودة)
-- =============================================================================

INSERT INTO public.design_settings (
  site_key,
  primary_color,
  secondary_color,
  background_color,
  text_color,
  heading_font,
  body_font,
  logo_bucket,
  logo_path,
  updated_at
) VALUES (
  'default',
  '#760614',
  '#a13030',
  '#ffffff',
  '#1a1a1a',
  'Cairo',
  'Cairo',
  'site-logo',
  'logo.png',
  NOW()
)
ON CONFLICT (site_key) DO UPDATE 
SET updated_at = NOW();

-- =============================================================================
-- 5. Verify and Display Results
-- التحقق وعرض النتائج
-- =============================================================================

-- عرض إعدادات المتجر الحالية
SELECT 
  id,
  store_name,
  store_description,
  shipping_fee,
  currency,
  updated_at
FROM public.store_settings
LIMIT 1;

-- عرض إعدادات التصميم الحالية
SELECT 
  site_key,
  primary_color,
  secondary_color,
  heading_font,
  body_font,
  updated_at
FROM public.design_settings
WHERE site_key = 'default'
LIMIT 1;

-- عرض جميع RLS Policies على store_settings
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'store_settings'
ORDER BY policyname;

-- عرض جميع RLS Policies على page_content
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'page_content'
ORDER BY policyname;

-- =============================================================================
-- Success! الآن يمكنك:
-- Now you can:
-- =============================================================================
-- 1. ✅ API routes يمكنها الوصول إلى store_settings و page_content
--    API routes can now access store_settings and page_content
--
-- 2. ✅ المستخدمون العاديون يمكنهم قراءة البيانات المنشورة
--    Regular users can read published data
--
-- 3. ✅ المسؤولون يمكنهم إدارة كل شيء
--    Admins can manage everything
--
-- 4. ✅ Service role (backend) يمكنه فعل أي شيء
--    Service role (backend) can do anything
-- =============================================================================
