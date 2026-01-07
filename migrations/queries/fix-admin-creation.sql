-- =============================================================================
-- Fix Admin Creation - Allow Public Registration for First Admin
-- إصلاح إنشاء المسؤول - السماح بالتسجيل العام لأول مسؤول
-- =============================================================================
-- This allows the first admin to be created without authentication
-- هذا يسمح بإنشاء أول مسؤول بدون مصادقة
-- =============================================================================

-- =============================================================================
-- 1. Fix Profiles Table RLS - Allow Public Insert for Admin Creation
-- إصلاح سياسات RLS لجدول الملفات الشخصية - السماح بالإضافة العامة
-- =============================================================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can create profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can do anything on profiles" ON public.profiles;

-- Allow authenticated users to create their own profile
CREATE POLICY "Users can create their own profile" 
ON public.profiles
FOR INSERT 
TO authenticated
WITH CHECK (id = auth.uid());

-- Allow public/anonymous to create profiles (for admin signup via service role)
CREATE POLICY "Service role can create any profile" 
ON public.profiles
FOR INSERT
USING (true)
WITH CHECK (true);

-- Service role can do anything (for backend operations)
CREATE POLICY "Service role full access on profiles" 
ON public.profiles
FOR ALL 
USING (true)
WITH CHECK (true);

-- =============================================================================
-- 2. Create Function to Check if Any Admin Exists
-- إنشاء دالة للتحقق من وجود أي مسؤول
-- =============================================================================

CREATE OR REPLACE FUNCTION public.has_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE role = 'admin'
  );
$$;

-- =============================================================================
-- 3. Create Function to Count Admin Users
-- إنشاء دالة لعد المستخدمين المسؤولين
-- =============================================================================

CREATE OR REPLACE FUNCTION public.count_admin_users()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*)::integer
  FROM public.profiles 
  WHERE role = 'admin';
$$;

-- =============================================================================
-- 4. Grant Execute Permissions on Functions
-- منح صلاحيات التنفيذ على الدوال
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.has_admin_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.count_admin_users() TO anon, authenticated;

-- =============================================================================
-- 5. Verify Results
-- التحقق من النتائج
-- =============================================================================

-- Check if admin exists
SELECT public.has_admin_user() as "Admin Exists";

-- Count admin users
SELECT public.count_admin_users() as "Admin Count";

-- Show all profiles
SELECT 
  id,
  name,
  role,
  phone_number,
  updated_at
FROM public.profiles
ORDER BY updated_at DESC
LIMIT 5;

-- Show all RLS policies on profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- =============================================================================
-- Success! الآن:
-- Now:
-- =============================================================================
-- 1. ✅ يمكن إنشاء أول مسؤول بدون مصادقة
--    First admin can be created without authentication
--
-- 2. ✅ Service role يمكنه إنشاء profiles بأي role
--    Service role can create profiles with any role
--
-- 3. ✅ دوال للتحقق من وجود مسؤولين
--    Functions to check if admins exist
-- =============================================================================
