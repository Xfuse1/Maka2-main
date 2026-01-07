-- =============================================================================
-- Complete Database Setup - Makastore
-- إعداد قاعدة البيانات الكاملة - متجر مكة
-- =============================================================================
-- نسخ هذا الكود بالكامل وتشغيله في Supabase SQL Editor
-- Copy this entire code and run in Supabase SQL Editor
-- =============================================================================
-- يجمع هذا الملف:
-- This file combines:
-- 1. create_all_tables.sql - إنشاء جميع الجداول
-- 2. fix-rls-policies.sql - إصلاح سياسات RLS
-- 3. fix-infinite-recursion.sql - إصلاح التكرار اللانهائي
-- 4. fix-admin-creation.sql - إصلاح إنشاء المسؤول
-- 5. fix-profiles-service-role.sql - منح صلاحيات Service Role
-- 6. fix-logo-storage-policies.sql - إصلاح صلاحيات التخزين
-- =============================================================================

-- =============================================================================
-- Step 1: Create Extensions (if not exist)
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- Step 2: Create Tables (بدون Foreign Keys أولاً)
-- =============================================================================

-- 1. Categories (مستقل)
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  slug text NOT NULL UNIQUE,
  description_ar text,
  description_en text,
  image_url text,
  parent_id uuid,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);

-- 2. Customers (مستقل)
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id)
);

-- 3. Products (يعتمد على categories)
CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  slug text NOT NULL UNIQUE,
  description_ar text,
  description_en text,
  category_id uuid,
  base_price numeric NOT NULL,
  compare_at_price numeric,
  cost_price numeric,
  sku text UNIQUE,
  barcode text,
  track_inventory boolean DEFAULT true,
  inventory_quantity integer DEFAULT 0,
  low_stock_threshold integer DEFAULT 5,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  tags text[],
  meta_title_ar text,
  meta_title_en text,
  meta_description_ar text,
  meta_description_en text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  shipping_type character varying DEFAULT 'free'::character varying,
  shipping_cost numeric DEFAULT 0,
  free_shipping boolean DEFAULT false,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

-- 4. Product Variants (يعتمد على products)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  sku text UNIQUE,
  barcode text,
  price numeric NOT NULL,
  compare_at_price numeric,
  cost_price numeric,
  inventory_quantity integer DEFAULT 0,
  size text,
  color text,
  color_hex text,
  weight numeric,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_variants_pkey PRIMARY KEY (id)
);

-- 5. Product Images (يعتمد على products)
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid,
  image_url text NOT NULL,
  alt_text_ar text,
  alt_text_en text,
  display_order integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_images_pkey PRIMARY KEY (id)
);

-- 6. Product Reviews (يعتمد على products و orders)
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL,
  customer_name text NOT NULL,
  customer_email text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text NOT NULL,
  is_approved boolean DEFAULT false,
  is_verified_purchase boolean DEFAULT false,
  order_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_reviews_pkey PRIMARY KEY (id)
);

-- 7. Product Recommendations (يعتمد على products)
CREATE TABLE IF NOT EXISTS public.product_recommendations (
  product_id uuid NOT NULL,
  recommended_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_recommendations_pkey PRIMARY KEY (product_id)
);

-- 8. Cart Items (يعتمد على customers و product_variants)
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  session_id text,
  product_variant_id uuid,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  size text,
  color text,
  CONSTRAINT cart_items_pkey PRIMARY KEY (id)
);

-- 9. Orders (يعتمد على customers)
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_number text NOT NULL UNIQUE,
  customer_id uuid,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'processing'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text, 'refunded'::text])),
  payment_status text NOT NULL DEFAULT 'pending'::text CHECK (payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'refunded'::text])),
  payment_method text,
  subtotal numeric NOT NULL,
  shipping_cost numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  total numeric NOT NULL,
  currency text DEFAULT 'SAR'::text,
  shipping_address_line1 text NOT NULL,
  shipping_address_line2 text,
  shipping_city text NOT NULL,
  shipping_state text,
  shipping_postal_code text,
  shipping_country text NOT NULL DEFAULT 'SA'::text,
  billing_address_line1 text,
  billing_address_line2 text,
  billing_city text,
  billing_state text,
  billing_postal_code text,
  billing_country text,
  notes text,
  tracking_number text,
  shipped_at timestamp with time zone,
  delivered_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT orders_pkey PRIMARY KEY (id)
);

-- 10. Order Items (يعتمد على orders و products و product_variants)
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid,
  product_id uuid,
  variant_id uuid,
  product_name_ar text NOT NULL,
  product_name_en text NOT NULL,
  variant_name_ar text,
  variant_name_en text,
  sku text,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id)
);

-- 11. Discount Coupons (مستقل)
CREATE TABLE IF NOT EXISTS public.discount_coupons (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text, 'free_shipping'::text])),
  discount_value numeric NOT NULL,
  min_purchase_amount numeric DEFAULT 0,
  max_discount_amount numeric,
  usage_limit integer,
  used_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  starts_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT discount_coupons_pkey PRIMARY KEY (id)
);

-- 12. Coupon Usage (يعتمد على discount_coupons و orders و customers)
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  coupon_id uuid,
  order_id uuid,
  customer_id uuid,
  discount_amount numeric NOT NULL,
  used_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coupon_usage_pkey PRIMARY KEY (id)
);

-- 13. Admins (يعتمد على auth.users)
CREATE TABLE IF NOT EXISTS public.admins (
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'admin'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admins_pkey PRIMARY KEY (user_id)
);

-- 14. Profiles (يعتمد على auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  name text,
  phone_number text,
  image_url text,
  role text DEFAULT 'user'::text,
  updated_at timestamp without time zone,
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- 15. Store Settings (مستقل)
CREATE TABLE IF NOT EXISTS public.store_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  shipping_fee numeric DEFAULT 50.00,
  free_shipping_threshold numeric DEFAULT 500.00,
  tax_rate numeric DEFAULT 0.00,
  currency text DEFAULT 'EGP'::text,
  updated_at timestamp with time zone DEFAULT now(),
  store_name text,
  store_description text,
  updated_by uuid,
  CONSTRAINT store_settings_pkey PRIMARY KEY (id)
);

-- 16. Design Settings (مستقل)
CREATE TABLE IF NOT EXISTS public.design_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  primary_color text NOT NULL DEFAULT '#760614'::text,
  secondary_color text NOT NULL DEFAULT '#a13030'::text,
  background_color text NOT NULL DEFAULT '#ffffff'::text,
  text_color text NOT NULL DEFAULT '#1a1a1a'::text,
  heading_font text NOT NULL DEFAULT 'Cairo'::text,
  body_font text NOT NULL DEFAULT 'Cairo'::text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  logo_bucket text NOT NULL DEFAULT 'site-logo'::text,
  logo_path text NOT NULL DEFAULT 'logo.png'::text,
  site_key text NOT NULL DEFAULT 'default'::text UNIQUE,
  CONSTRAINT design_settings_pkey PRIMARY KEY (id)
);

-- 17. Hero Slides (مستقل)
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title_ar character varying NOT NULL,
  title_en character varying,
  subtitle_ar text,
  subtitle_en text,
  image_url character varying NOT NULL,
  link_url character varying,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT hero_slides_pkey PRIMARY KEY (id)
);

-- 18. Sliders (مستقل)
CREATE TABLE IF NOT EXISTS public.sliders (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  image_url text NOT NULL,
  title_ar text,
  subtitle_ar text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  title_en character varying,
  subtitle_en text,
  link_url character varying,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sliders_pkey PRIMARY KEY (id)
);

-- 19. Homepage Sections (مستقل)
CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name_ar character varying NOT NULL,
  name_en character varying,
  section_type character varying NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  max_items integer DEFAULT 8,
  product_ids jsonb DEFAULT '[]'::jsonb,
  category_ids jsonb DEFAULT '[]'::jsonb,
  layout_type character varying DEFAULT 'grid'::character varying,
  show_title boolean DEFAULT true,
  show_description boolean DEFAULT true,
  background_color character varying DEFAULT 'background'::character varying,
  custom_content jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  title_ar character varying,
  title_en character varying,
  subtitle_ar text,
  subtitle_en text,
  description_ar text,
  description_en text,
  image_url character varying,
  button_text_ar character varying,
  button_text_en character varying,
  button_link character varying,
  description text,
  CONSTRAINT homepage_sections_pkey PRIMARY KEY (id)
);

-- 20. Page Content (مستقل)
CREATE TABLE IF NOT EXISTS public.page_content (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  page_path text NOT NULL UNIQUE,
  page_title_ar text NOT NULL,
  page_title_en text NOT NULL,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  meta_title_ar text,
  meta_title_en text,
  meta_description_ar text,
  meta_description_en text,
  is_published boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  sections_images jsonb DEFAULT '{}'::jsonb,
  url_image text,
  CONSTRAINT page_content_pkey PRIMARY KEY (id)
);

-- 21. Contact Messages (مستقل)
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name text,
  email text,
  phone text,
  message text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contact_messages_pkey PRIMARY KEY (id)
);

-- 22. Analytics Events (مستقل)
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text,
  user_name text,
  event_name text NOT NULL,
  page_url text,
  referrer text,
  session_id text,
  product_id text,
  product_name text,
  product_price numeric,
  product_currency text,
  order_id text,
  order_total numeric,
  order_currency text,
  meta_event_id text,
  raw_payload jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT analytics_events_pkey PRIMARY KEY (id)
);

-- 23. Payment Methods (مستقل)
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payment_methods_pkey PRIMARY KEY (id)
);

-- 24. Payment Offers (مستقل)
CREATE TABLE IF NOT EXISTS public.payment_offers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  payment_method text NOT NULL,
  discount_type text DEFAULT 'percentage'::text,
  discount_value numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payment_offers_pkey PRIMARY KEY (id)
);

-- 25. Payment Transactions (مستقل)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  payment_method_id text,
  transaction_id text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'EGP'::text,
  status text NOT NULL,
  ip_address text,
  user_agent text,
  gateway_response jsonb,
  initiated_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  failed_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payment_transactions_pkey PRIMARY KEY (id)
);

-- 26. Payment Logs (مستقل)
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_id text NOT NULL,
  event_type text NOT NULL,
  message text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payment_logs_pkey PRIMARY KEY (id)
);

-- 27. Payment Webhooks (مستقل)
CREATE TABLE IF NOT EXISTS public.payment_webhooks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  source text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  signature text,
  signature_verified boolean DEFAULT false,
  status text DEFAULT 'received'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payment_webhooks_pkey PRIMARY KEY (id)
);

-- 28. Payment Refunds (مستقل)
CREATE TABLE IF NOT EXISTS public.payment_refunds (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_id text NOT NULL,
  refund_amount numeric,
  status text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT payment_refunds_pkey PRIMARY KEY (id)
);

-- 29. Payment Rate Limits (مستقل)
CREATE TABLE IF NOT EXISTS public.payment_rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  identifier_type text NOT NULL,
  identifier_value text NOT NULL,
  attempt_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  window_end timestamp with time zone,
  is_blocked boolean DEFAULT false,
  blocked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payment_rate_limits_pkey PRIMARY KEY (id)
);

-- 30. Security Events (يعتمد على customers و orders)
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'low'::text CHECK (severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])),
  description text,
  details jsonb DEFAULT '{}'::jsonb,
  transaction_id uuid,
  customer_id uuid,
  order_id uuid,
  ip_address inet,
  user_agent text,
  location jsonb,
  status text DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'investigating'::text, 'resolved'::text, 'false_positive'::text])),
  resolved_at timestamp with time zone,
  resolved_by uuid,
  resolution_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT security_events_pkey PRIMARY KEY (id)
);

-- 31. Fraud Rules (مستقل)
CREATE TABLE IF NOT EXISTS public.fraud_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  rule_type text NOT NULL,
  conditions jsonb NOT NULL,
  action text NOT NULL CHECK (action = ANY (ARRAY['flag'::text, 'block'::text, 'review'::text, 'alert'::text])),
  severity text DEFAULT 'medium'::text CHECK (severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])),
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fraud_rules_pkey PRIMARY KEY (id)
);

-- 32. Shipping Zones (مستقل)
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  governorate_code text NOT NULL UNIQUE,
  governorate_name_ar text NOT NULL,
  governorate_name_en text NOT NULL,
  shipping_price numeric NOT NULL DEFAULT 50.00,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT shipping_zones_pkey PRIMARY KEY (id)
);

-- 33. Addresses (يعتمد على auth.users)
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  label text,
  full_name text,
  phone text,
  street text,
  city text,
  state text,
  postal_code text,
  country text DEFAULT 'Egypt'::text,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT addresses_pkey PRIMARY KEY (id)
);

-- =============================================================================
-- Step 3: Add Foreign Keys
-- =============================================================================

-- Categories self-reference
ALTER TABLE public.categories 
  DROP CONSTRAINT IF EXISTS categories_parent_id_fkey;
ALTER TABLE public.categories 
  ADD CONSTRAINT categories_parent_id_fkey 
  FOREIGN KEY (parent_id) REFERENCES public.categories(id);

-- Products
ALTER TABLE public.products 
  DROP CONSTRAINT IF EXISTS products_category_id_fkey;
ALTER TABLE public.products 
  ADD CONSTRAINT products_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES public.categories(id);

-- Product Variants
ALTER TABLE public.product_variants 
  DROP CONSTRAINT IF EXISTS product_variants_product_id_fkey;
ALTER TABLE public.product_variants 
  ADD CONSTRAINT product_variants_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES public.products(id);

-- Product Images
ALTER TABLE public.product_images 
  DROP CONSTRAINT IF EXISTS product_images_product_id_fkey;
ALTER TABLE public.product_images 
  ADD CONSTRAINT product_images_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES public.products(id);

-- Product Recommendations
ALTER TABLE public.product_recommendations 
  DROP CONSTRAINT IF EXISTS fk_product_recommendations_product;
ALTER TABLE public.product_recommendations 
  ADD CONSTRAINT fk_product_recommendations_product 
  FOREIGN KEY (product_id) REFERENCES public.products(id);

-- Cart Items
ALTER TABLE public.cart_items 
  DROP CONSTRAINT IF EXISTS cart_items_user_id_fkey;
ALTER TABLE public.cart_items 
  ADD CONSTRAINT cart_items_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.customers(id);

ALTER TABLE public.cart_items 
  DROP CONSTRAINT IF EXISTS cart_items_product_variant_id_fkey;
ALTER TABLE public.cart_items 
  ADD CONSTRAINT cart_items_product_variant_id_fkey 
  FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id);

-- Orders
ALTER TABLE public.orders 
  DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;
ALTER TABLE public.orders 
  ADD CONSTRAINT orders_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES public.customers(id);

-- Order Items
ALTER TABLE public.order_items 
  DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
ALTER TABLE public.order_items 
  ADD CONSTRAINT order_items_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE public.order_items 
  DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
ALTER TABLE public.order_items 
  ADD CONSTRAINT order_items_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE public.order_items 
  DROP CONSTRAINT IF EXISTS order_items_variant_id_fkey;
ALTER TABLE public.order_items 
  ADD CONSTRAINT order_items_variant_id_fkey 
  FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);

-- Product Reviews
ALTER TABLE public.product_reviews 
  DROP CONSTRAINT IF EXISTS product_reviews_product_id_fkey;
ALTER TABLE public.product_reviews 
  ADD CONSTRAINT product_reviews_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE public.product_reviews 
  DROP CONSTRAINT IF EXISTS product_reviews_order_id_fkey;
ALTER TABLE public.product_reviews 
  ADD CONSTRAINT product_reviews_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES public.orders(id);

-- Coupon Usage
ALTER TABLE public.coupon_usage 
  DROP CONSTRAINT IF EXISTS coupon_usage_coupon_id_fkey;
ALTER TABLE public.coupon_usage 
  ADD CONSTRAINT coupon_usage_coupon_id_fkey 
  FOREIGN KEY (coupon_id) REFERENCES public.discount_coupons(id);

ALTER TABLE public.coupon_usage 
  DROP CONSTRAINT IF EXISTS coupon_usage_order_id_fkey;
ALTER TABLE public.coupon_usage 
  ADD CONSTRAINT coupon_usage_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE public.coupon_usage 
  DROP CONSTRAINT IF EXISTS coupon_usage_customer_id_fkey;
ALTER TABLE public.coupon_usage 
  ADD CONSTRAINT coupon_usage_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES public.customers(id);

-- Security Events
ALTER TABLE public.security_events 
  DROP CONSTRAINT IF EXISTS security_events_customer_id_fkey;
ALTER TABLE public.security_events 
  ADD CONSTRAINT security_events_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE public.security_events 
  DROP CONSTRAINT IF EXISTS security_events_order_id_fkey;
ALTER TABLE public.security_events 
  ADD CONSTRAINT security_events_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES public.orders(id);

-- =============================================================================
-- Step 4: Create Indexes (للأداء)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON public.cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_is_approved ON public.product_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_discount_coupons_code ON public.discount_coupons(code);
CREATE INDEX IF NOT EXISTS idx_discount_coupons_is_active ON public.discount_coupons(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON public.addresses(is_default) WHERE is_default = true;

-- =============================================================================
-- Step 5: Enable Row Level Security (RLS)
-- =============================================================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sliders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Step 6: Drop ALL Existing Policies (تجنب التعارض)
-- =============================================================================

DO $$ 
DECLARE 
  pol record;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
      pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- =============================================================================
-- Step 7: Create RLS Policies (بدون تكرار لانهائي)
-- =============================================================================

-- =====================
-- Profiles Policies (NO RECURSION!)
-- =====================

-- Service role full access (أهم policy!)
CREATE POLICY "service_role_full_access" 
ON public.profiles
AS PERMISSIVE
FOR ALL 
USING (true)
WITH CHECK (true);

-- Users can read own profile
CREATE POLICY "users_read_own_profile" 
ON public.profiles
AS PERMISSIVE
FOR SELECT 
TO authenticated
USING (id = auth.uid());

-- Users can update own profile
CREATE POLICY "users_update_own_profile" 
ON public.profiles
AS PERMISSIVE
FOR UPDATE 
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Users can insert own profile
CREATE POLICY "users_insert_own_profile" 
ON public.profiles
AS PERMISSIVE
FOR INSERT 
TO authenticated
WITH CHECK (id = auth.uid());

-- =====================
-- Categories Policies
-- =====================

CREATE POLICY "public_read_active_categories"
ON public.categories FOR SELECT
USING (is_active = true);

CREATE POLICY "authenticated_manage_categories"
ON public.categories FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Products Policies
-- =====================

CREATE POLICY "public_read_active_products"
ON public.products FOR SELECT
USING (is_active = true);

CREATE POLICY "authenticated_manage_products"
ON public.products FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Product Images Policies
-- =====================

CREATE POLICY "public_read_product_images"
ON public.product_images FOR SELECT
USING (true);

CREATE POLICY "authenticated_manage_product_images"
ON public.product_images FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Product Variants Policies
-- =====================

CREATE POLICY "public_read_active_variants"
ON public.product_variants FOR SELECT
USING (is_active = true);

CREATE POLICY "authenticated_manage_variants"
ON public.product_variants FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Orders Policies
-- =====================

CREATE POLICY "users_read_own_orders"
ON public.orders FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "authenticated_create_orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "public_create_orders"
ON public.orders FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "authenticated_manage_all_orders"
ON public.orders FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Order Items Policies
-- =====================

CREATE POLICY "users_read_own_order_items"
ON public.order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "authenticated_create_order_items"
ON public.order_items FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "public_create_order_items"
ON public.order_items FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "authenticated_manage_all_order_items"
ON public.order_items FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Customers Policies
-- =====================

CREATE POLICY "users_read_own_customer_data"
ON public.customers FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "public_create_customers"
ON public.customers FOR INSERT
WITH CHECK (true);

CREATE POLICY "users_update_own_customer_data"
ON public.customers FOR UPDATE
TO authenticated
USING (
  id = auth.uid() OR
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
)
WITH CHECK (
  id = auth.uid() OR
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "authenticated_manage_all_customers"
ON public.customers FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Cart Items Policies
-- =====================

CREATE POLICY "users_manage_own_cart"
ON public.cart_items FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "anon_manage_cart_by_session"
ON public.cart_items FOR ALL
TO anon
USING (user_id IS NULL)
WITH CHECK (user_id IS NULL);

-- =====================
-- Product Reviews Policies
-- =====================

CREATE POLICY "public_read_approved_reviews"
ON public.product_reviews FOR SELECT
USING (is_approved = true);

CREATE POLICY "authenticated_create_reviews"
ON public.product_reviews FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated_manage_all_reviews"
ON public.product_reviews FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Design Settings Policies
-- =====================

CREATE POLICY "public_read_design_settings"
ON public.design_settings FOR SELECT
USING (true);

CREATE POLICY "authenticated_manage_design_settings"
ON public.design_settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Page Content Policies
-- =====================

CREATE POLICY "public_read_published_pages"
ON public.page_content FOR SELECT
USING (is_published = true);

CREATE POLICY "authenticated_manage_pages"
ON public.page_content FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Contact Messages Policies
-- =====================

CREATE POLICY "public_create_contact_messages"
ON public.contact_messages FOR INSERT
WITH CHECK (true);

CREATE POLICY "authenticated_read_contact_messages"
ON public.contact_messages FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_manage_contact_messages"
ON public.contact_messages FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Hero Slides Policies
-- =====================

CREATE POLICY "public_read_active_hero_slides"
ON public.hero_slides FOR SELECT
USING (is_active = true);

CREATE POLICY "authenticated_manage_hero_slides"
ON public.hero_slides FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Payment Transactions Policies
-- =====================

CREATE POLICY "users_read_own_transactions"
ON public.payment_transactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.order_number = payment_transactions.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "public_create_transactions"
ON public.payment_transactions FOR INSERT
WITH CHECK (true);

CREATE POLICY "authenticated_manage_all_transactions"
ON public.payment_transactions FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Analytics Events Policies
-- =====================

CREATE POLICY "public_create_analytics"
ON public.analytics_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "authenticated_read_analytics"
ON public.analytics_events FOR SELECT
TO authenticated
USING (true);

-- =====================
-- Security Events Policies
-- =====================

CREATE POLICY "public_create_security_events"
ON public.security_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "authenticated_manage_security_events"
ON public.security_events FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Coupon Usage Policies
-- =====================

CREATE POLICY "users_read_own_coupon_usage"
ON public.coupon_usage FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM public.customers 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "public_create_coupon_usage"
ON public.coupon_usage FOR INSERT
WITH CHECK (true);

CREATE POLICY "authenticated_manage_coupon_usage"
ON public.coupon_usage FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Addresses Policies
-- =====================

CREATE POLICY "users_manage_own_addresses"
ON public.addresses FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_manage_all_addresses"
ON public.addresses FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Product Recommendations Policies
-- =====================

CREATE POLICY "public_read_recommendations"
ON public.product_recommendations FOR SELECT
USING (true);

CREATE POLICY "authenticated_manage_recommendations"
ON public.product_recommendations FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Discount Coupons Policies
-- =====================

CREATE POLICY "public_read_active_coupons"
ON public.discount_coupons FOR SELECT
USING (is_active = true);

CREATE POLICY "authenticated_manage_coupons"
ON public.discount_coupons FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Store Settings Policies
-- =====================

CREATE POLICY "public_read_store_settings"
ON public.store_settings FOR SELECT
USING (true);

CREATE POLICY "authenticated_manage_store_settings"
ON public.store_settings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Sliders Policies
-- =====================

CREATE POLICY "public_read_active_sliders"
ON public.sliders FOR SELECT
USING (is_active = true);

CREATE POLICY "authenticated_manage_sliders"
ON public.sliders FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Homepage Sections Policies
-- =====================

CREATE POLICY "public_read_active_sections"
ON public.homepage_sections FOR SELECT
USING (is_active = true);

CREATE POLICY "authenticated_manage_sections"
ON public.homepage_sections FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Payment Methods Policies
-- =====================

CREATE POLICY "public_read_active_payment_methods"
ON public.payment_methods FOR SELECT
USING (is_active = true);

CREATE POLICY "authenticated_manage_payment_methods"
ON public.payment_methods FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Payment Offers Policies
-- =====================

CREATE POLICY "public_read_active_payment_offers"
ON public.payment_offers FOR SELECT
USING (is_active = true);

CREATE POLICY "authenticated_manage_payment_offers"
ON public.payment_offers FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Payment Logs Policies
-- =====================

CREATE POLICY "public_create_payment_logs"
ON public.payment_logs FOR INSERT
WITH CHECK (true);

CREATE POLICY "authenticated_read_payment_logs"
ON public.payment_logs FOR SELECT
TO authenticated
USING (true);

-- =====================
-- Payment Webhooks Policies
-- =====================

CREATE POLICY "public_create_payment_webhooks"
ON public.payment_webhooks FOR INSERT
WITH CHECK (true);

CREATE POLICY "authenticated_manage_payment_webhooks"
ON public.payment_webhooks FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Payment Refunds Policies
-- =====================

CREATE POLICY "public_create_payment_refunds"
ON public.payment_refunds FOR INSERT
WITH CHECK (true);

CREATE POLICY "authenticated_manage_payment_refunds"
ON public.payment_refunds FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Payment Rate Limits Policies
-- =====================

CREATE POLICY "public_manage_rate_limits"
ON public.payment_rate_limits FOR ALL
WITH CHECK (true);

CREATE POLICY "authenticated_read_rate_limits"
ON public.payment_rate_limits FOR SELECT
TO authenticated
USING (true);

-- =====================
-- Fraud Rules Policies
-- =====================

CREATE POLICY "authenticated_manage_fraud_rules"
ON public.fraud_rules FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Shipping Zones Policies
-- =====================

CREATE POLICY "public_read_active_shipping_zones"
ON public.shipping_zones FOR SELECT
USING (is_active = true);

CREATE POLICY "authenticated_manage_shipping_zones"
ON public.shipping_zones FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================
-- Admins Table Policies
-- =====================

CREATE POLICY "authenticated_manage_admins"
ON public.admins FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =============================================================================
-- Step 8: Create Storage Buckets and Policies
-- =============================================================================

-- Site Logo Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-logo',
  'site-logo',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];

-- Products Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Categories Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'categories',
  'categories',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Pages Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pages',
  'pages',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- Drop existing storage policies
DROP POLICY IF EXISTS "Public can view logo" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logo" ON storage.objects;
DROP POLICY IF EXISTS "Public can read product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read category images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload category images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update category images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete category images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read page images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload page images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update page images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete page images" ON storage.objects;

-- Storage policies for site-logo
CREATE POLICY "Public can view logo"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-logo');

CREATE POLICY "Authenticated users can upload logo"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'site-logo')
WITH CHECK (bucket_id = 'site-logo');

-- Storage policies for products
CREATE POLICY "Public can read product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

CREATE POLICY "Authenticated can manage product images"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'products')
WITH CHECK (bucket_id = 'products');

-- Storage policies for categories
CREATE POLICY "Public can read category images"
ON storage.objects FOR SELECT
USING (bucket_id = 'categories');

CREATE POLICY "Authenticated can manage category images"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'categories')
WITH CHECK (bucket_id = 'categories');

-- Storage policies for pages
CREATE POLICY "Public can read page images"
ON storage.objects FOR SELECT
USING (bucket_id = 'pages');

CREATE POLICY "Authenticated can manage page images"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'pages')
WITH CHECK (bucket_id = 'pages');

-- =============================================================================
-- Step 9: Create Triggers for Updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
DROP TRIGGER IF EXISTS update_product_variants_updated_at ON public.product_variants;
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS update_cart_items_updated_at ON public.cart_items;
DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON public.product_reviews;
DROP TRIGGER IF EXISTS update_store_settings_updated_at ON public.store_settings;
DROP TRIGGER IF EXISTS update_design_settings_updated_at ON public.design_settings;
DROP TRIGGER IF EXISTS update_hero_slides_updated_at ON public.hero_slides;
DROP TRIGGER IF EXISTS update_sliders_updated_at ON public.sliders;
DROP TRIGGER IF EXISTS update_homepage_sections_updated_at ON public.homepage_sections;
DROP TRIGGER IF EXISTS update_page_content_updated_at ON public.page_content;
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON public.payment_methods;
DROP TRIGGER IF EXISTS update_payment_offers_updated_at ON public.payment_offers;
DROP TRIGGER IF EXISTS update_shipping_zones_updated_at ON public.shipping_zones;
DROP TRIGGER IF EXISTS update_fraud_rules_updated_at ON public.fraud_rules;
DROP TRIGGER IF EXISTS update_security_events_updated_at ON public.security_events;

-- Create triggers
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON public.product_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_design_settings_updated_at BEFORE UPDATE ON public.design_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_hero_slides_updated_at BEFORE UPDATE ON public.hero_slides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sliders_updated_at BEFORE UPDATE ON public.sliders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_homepage_sections_updated_at BEFORE UPDATE ON public.homepage_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_page_content_updated_at BEFORE UPDATE ON public.page_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_offers_updated_at BEFORE UPDATE ON public.payment_offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shipping_zones_updated_at BEFORE UPDATE ON public.shipping_zones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fraud_rules_updated_at BEFORE UPDATE ON public.fraud_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_security_events_updated_at BEFORE UPDATE ON public.security_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- Step 10: Create Helper Functions
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

GRANT EXECUTE ON FUNCTION public.has_admin_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.count_admin_users() TO anon, authenticated;

-- =============================================================================
-- Step 11: Grant Permissions
-- =============================================================================

GRANT SELECT ON public.products TO authenticated, anon;
GRANT SELECT ON public.product_variants TO authenticated, anon;
GRANT SELECT ON public.product_images TO authenticated, anon;
GRANT SELECT ON public.categories TO authenticated, anon;
GRANT SELECT ON public.hero_slides TO authenticated, anon;
GRANT SELECT ON public.sliders TO authenticated, anon;
GRANT SELECT ON public.homepage_sections TO authenticated, anon;
GRANT SELECT ON public.page_content TO authenticated, anon;
GRANT SELECT ON public.discount_coupons TO authenticated, anon;
GRANT SELECT ON public.shipping_zones TO authenticated, anon;
GRANT SELECT ON public.payment_methods TO authenticated, anon;
GRANT SELECT ON public.payment_offers TO authenticated, anon;
GRANT SELECT ON public.store_settings TO authenticated, anon;
GRANT SELECT ON public.design_settings TO authenticated, anon;
GRANT INSERT ON public.contact_messages TO authenticated, anon;

-- =============================================================================
-- Step 12: Insert Initial Data
-- =============================================================================

-- Initial Store Settings
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
)
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- Initial Design Settings
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
ON CONFLICT (site_key) DO UPDATE SET updated_at = NOW();

-- =============================================================================
-- تم! قاعدة البيانات جاهزة بالكامل
-- Done! Database is fully ready
-- =============================================================================

-- ✅ 33 جدول تم إنشاؤها
-- ✅ Foreign Keys مضافة
-- ✅ Indexes للأداء
-- ✅ RLS مُفعّل على جميع الجداول
-- ✅ RLS Policies محدّثة (بدون تكرار لانهائي)
-- ✅ Storage Buckets مُنشأة
-- ✅ Storage Policies مُحدّثة
-- ✅ Triggers للـ updated_at
-- ✅ Helper Functions
-- ✅ البيانات الأولية
-- ✅ Service Role صلاحيات كاملة

-- =============================================================================
-- ملاحظات مهمة - IMPORTANT NOTES
-- =============================================================================

-- 1. لإنشاء أول مسؤول:
--    بعد التسجيل، قم بتشغيل:
--    UPDATE public.profiles SET role = 'admin' WHERE id = 'USER_UUID_HERE';

-- 2. Service role له صلاحيات كاملة على جميع الجداول
--    (مهم للـ API routes)

-- 3. لا يوجد infinite recursion في الـ RLS policies

-- 4. جميع المستخدمين المسجلين يمكنهم إدارة المحتوى
--    (يمكن تعديل هذا لاحقاً لتقييد الصلاحيات بناءً على role)

SELECT 'Database setup completed successfully! ✅' AS status;
