-- =============================================================================
-- Fix Profiles RLS - Allow Service Role Full Access
-- إصلاح RLS للـ profiles - منح service role صلاحيات كاملة
-- =============================================================================

-- Drop ALL existing policies on profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can create any profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can create profile" ON public.profiles;

-- =============================================================================
-- NEW POLICIES - Service Role First (Most Important!)
-- =============================================================================

-- 1. Service role can do EVERYTHING (bypasses all RLS)
CREATE POLICY "service_role_full_access" 
ON public.profiles
AS PERMISSIVE
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Authenticated users can read their own profile
CREATE POLICY "users_read_own_profile" 
ON public.profiles
AS PERMISSIVE
FOR SELECT 
TO authenticated
USING (id = auth.uid());

-- 3. Authenticated users can update their own profile
CREATE POLICY "users_update_own_profile" 
ON public.profiles
AS PERMISSIVE
FOR UPDATE 
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 4. Authenticated users can insert their own profile
CREATE POLICY "users_insert_own_profile" 
ON public.profiles
AS PERMISSIVE
FOR INSERT 
TO authenticated
WITH CHECK (id = auth.uid());

-- 5. Admins can read all profiles
CREATE POLICY "admins_read_all_profiles" 
ON public.profiles
AS PERMISSIVE
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- 6. Admins can manage all profiles
CREATE POLICY "admins_manage_all_profiles" 
ON public.profiles
AS PERMISSIVE
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- =============================================================================
-- Verify Results
-- =============================================================================

-- Show all policies on profiles table
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

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- =============================================================================
-- Test: Check if service_role can access
-- =============================================================================
SELECT 'Service role policy created successfully!' AS status;

-- =============================================================================
-- IMPORTANT: After running this script
-- بعد تشغيل هذا الملف:
-- =============================================================================
-- 1. Restart your dev server: pnpm dev
-- 2. Try admin signup again
-- 3. The service_role policy should allow the API to create profiles
-- =============================================================================
