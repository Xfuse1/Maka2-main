-- =============================================================================
-- Fix Logo Storage Bucket Policies
-- إصلاح صلاحيات bucket الشعار للسماح بالرفع
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view site logo" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage site logo" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logo" ON storage.objects;
DROP POLICY IF EXISTS "Public can view logo" ON storage.objects;

-- Create bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-logo',
  'site-logo',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];

-- 1. Allow everyone to view/download logos (public read)
CREATE POLICY "Public can view logo"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-logo');

-- 2. Allow authenticated users to upload/manage logos
CREATE POLICY "Authenticated users can upload logo"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'site-logo')
WITH CHECK (bucket_id = 'site-logo');
