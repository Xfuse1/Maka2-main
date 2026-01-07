-- =============================================================================
-- إنشاء جميع الجداول - Makastore Database Schema
-- Create All Tables - Ready to Run in New Supabase Project
-- =============================================================================
-- نسخ هذا الكود بالكامل وتشغيله في Supabase SQL Editor
-- Copy this entire code and run in Supabase SQL Editor
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
  ADD CONSTRAINT categories_parent_id_fkey 
  FOREIGN KEY (parent_id) REFERENCES public.categories(id);

-- Products
ALTER TABLE public.products 
  ADD CONSTRAINT products_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES public.categories(id);

-- Product Variants
ALTER TABLE public.product_variants 
  ADD CONSTRAINT product_variants_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES public.products(id);

-- Product Images
ALTER TABLE public.product_images 
  ADD CONSTRAINT product_images_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES public.products(id);

-- Product Recommendations
ALTER TABLE public.product_recommendations 
  ADD CONSTRAINT fk_product_recommendations_product 
  FOREIGN KEY (product_id) REFERENCES public.products(id);

-- Cart Items
ALTER TABLE public.cart_items 
  ADD CONSTRAINT cart_items_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.customers(id);

ALTER TABLE public.cart_items 
  ADD CONSTRAINT cart_items_product_variant_id_fkey 
  FOREIGN KEY (product_variant_id) REFERENCES public.product_variants(id);

-- Orders
ALTER TABLE public.orders 
  ADD CONSTRAINT orders_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES public.customers(id);

-- Order Items
ALTER TABLE public.order_items 
  ADD CONSTRAINT order_items_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE public.order_items 
  ADD CONSTRAINT order_items_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE public.order_items 
  ADD CONSTRAINT order_items_variant_id_fkey 
  FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);

-- Product Reviews
ALTER TABLE public.product_reviews 
  ADD CONSTRAINT product_reviews_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE public.product_reviews 
  ADD CONSTRAINT product_reviews_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES public.orders(id);

-- Coupon Usage
ALTER TABLE public.coupon_usage 
  ADD CONSTRAINT coupon_usage_coupon_id_fkey 
  FOREIGN KEY (coupon_id) REFERENCES public.discount_coupons(id);

ALTER TABLE public.coupon_usage 
  ADD CONSTRAINT coupon_usage_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE public.coupon_usage 
  ADD CONSTRAINT coupon_usage_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES public.customers(id);

-- Security Events
ALTER TABLE public.security_events 
  ADD CONSTRAINT security_events_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE public.security_events 
  ADD CONSTRAINT security_events_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES public.orders(id);

-- Auth-related Foreign Keys (تشتغل إذا كان auth.users موجود)
-- Uncomment if auth.users exists:

-- ALTER TABLE public.admins 
--   ADD CONSTRAINT admins_user_id_fkey 
--   FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- ALTER TABLE public.profiles 
--   ADD CONSTRAINT profiles_id_fkey 
--   FOREIGN KEY (id) REFERENCES auth.users(id);

-- ALTER TABLE public.store_settings 
--   ADD CONSTRAINT store_settings_updated_by_fkey 
--   FOREIGN KEY (updated_by) REFERENCES auth.users(id);

-- =============================================================================
-- Step 4: Create Indexes (للأداء)
-- =============================================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured) WHERE is_featured = true;

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Order Items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- Cart Items indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON public.cart_items(session_id);

-- Product Variants indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);

-- Product Images indexes
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);

-- Product Reviews indexes
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_is_approved ON public.product_reviews(is_approved);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- Discount Coupons indexes
CREATE INDEX IF NOT EXISTS idx_discount_coupons_code ON public.discount_coupons(code);
CREATE INDEX IF NOT EXISTS idx_discount_coupons_is_active ON public.discount_coupons(is_active) WHERE is_active = true;

-- Payment Transactions indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at DESC);

-- Analytics Events indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);

-- Addresses indexes
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON public.addresses(is_default) WHERE is_default = true;

-- =============================================================================
-- Step 5: Enable Row Level Security (RLS)
-- =============================================================================

-- Enable RLS on all tables
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
-- Step 6: Create RLS Policies
-- =============================================================================

-- =====================
-- Categories Policies
-- =====================

-- Public can view active categories
CREATE POLICY "Public can view active categories"
ON public.categories
FOR SELECT
USING (is_active = true);

-- Admins can view all categories
CREATE POLICY "Admins can view all categories"
ON public.categories
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Admins can insert categories
CREATE POLICY "Admins can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Admins can update categories
CREATE POLICY "Admins can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Admins can delete categories
CREATE POLICY "Admins can delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Products Policies
-- =====================

-- Public can view active products
CREATE POLICY "Public can view active products"
ON public.products
FOR SELECT
USING (is_active = true);

-- Admins can view all products
CREATE POLICY "Admins can view all products"
ON public.products
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Admins can manage products
CREATE POLICY "Admins can manage products"
ON public.products
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Product Images Policies
-- =====================

-- Public can view product images
CREATE POLICY "Public can view product images"
ON public.product_images
FOR SELECT
USING (true);

-- Admins can manage product images
CREATE POLICY "Admins can manage product images"
ON public.product_images
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Product Variants Policies
-- =====================

-- Public can view active variants
CREATE POLICY "Public can view active variants"
ON public.product_variants
FOR SELECT
USING (is_active = true);

-- Admins can manage variants
CREATE POLICY "Admins can manage variants"
ON public.product_variants
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Orders Policies
-- =====================

-- Customers can view their own orders
CREATE POLICY "Customers can view own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow insert for authenticated users
CREATE POLICY "Authenticated users can create orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Allow public to create orders (for guest checkout)
CREATE POLICY "Public can create orders"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (true);

-- Admins can update orders
CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Order Items Policies
-- =====================

-- Customers can view their own order items
CREATE POLICY "Customers can view own order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Admins can view all order items
CREATE POLICY "Admins can view all order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow insert for authenticated users
CREATE POLICY "Authenticated users can create order items"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow public to create order items
CREATE POLICY "Public can create order items"
ON public.order_items
FOR INSERT
TO anon
WITH CHECK (true);

-- Admins can manage order items
CREATE POLICY "Admins can manage order items"
ON public.order_items
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Customers Policies
-- =====================

-- Customers can view own data
CREATE POLICY "Customers can view own data"
ON public.customers
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Admins can view all customers
CREATE POLICY "Admins can view all customers"
ON public.customers
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Customers can update own data
CREATE POLICY "Customers can update own data"
ON public.customers
FOR UPDATE
TO authenticated
USING (
  id = auth.uid() OR
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
)
WITH CHECK (
  id = auth.uid() OR
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Anyone can create customer records
CREATE POLICY "Anyone can create customer records"
ON public.customers
FOR INSERT
WITH CHECK (true);

-- Admins can manage customers
CREATE POLICY "Admins can manage customers"
ON public.customers
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Cart Items Policies
-- =====================

-- Users can view their own cart items
CREATE POLICY "Users can view their own cart"
ON public.cart_items
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own cart items
CREATE POLICY "Users can add to their cart"
ON public.cart_items
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own cart items
CREATE POLICY "Users can update their cart"
ON public.cart_items
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own cart items
CREATE POLICY "Users can delete from their cart"
ON public.cart_items
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Allow anonymous cart by session_id
CREATE POLICY "Anonymous users can manage cart by session"
ON public.cart_items
FOR ALL
TO anon
USING (user_id IS NULL)
WITH CHECK (user_id IS NULL);

-- =====================
-- Profiles Policies
-- =====================

-- Users can read own profile
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can update own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Users can create their own profile
CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Admins can manage all profiles
CREATE POLICY "Admins can manage profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Product Reviews Policies
-- =====================

-- Anyone can view approved reviews
CREATE POLICY "Anyone can view approved reviews"
ON public.product_reviews
FOR SELECT
USING (is_approved = true);

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
ON public.product_reviews
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
ON public.product_reviews
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Admins can manage reviews
CREATE POLICY "Admins can manage reviews"
ON public.product_reviews
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Design Settings Policies
-- =====================

-- Public can view design settings
CREATE POLICY "Public can view design settings"
ON public.design_settings
FOR SELECT
USING (true);

-- Admins can manage design settings
CREATE POLICY "Admins can manage design settings"
ON public.design_settings
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Page Content Policies
-- =====================

-- Public can view published pages
CREATE POLICY "Public can view published pages"
ON public.page_content
FOR SELECT
USING (is_published = true);

-- Admins can view all pages
CREATE POLICY "Admins can view all pages"
ON public.page_content
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Admins can manage pages
CREATE POLICY "Admins can manage pages"
ON public.page_content
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Contact Messages Policies
-- =====================

-- Anyone can insert contact messages
CREATE POLICY "Public can insert contact messages"
ON public.contact_messages
FOR INSERT
WITH CHECK (true);

-- Deny public select/update/delete
CREATE POLICY "Deny public select on contact messages"
ON public.contact_messages
FOR SELECT
USING (false);

-- Admins can view all messages
CREATE POLICY "Admins can view all contact messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Admins can manage messages
CREATE POLICY "Admins can manage contact messages"
ON public.contact_messages
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Hero Slides Policies
-- =====================

-- Public can view active hero slides
CREATE POLICY "Public can view active hero slides"
ON public.hero_slides
FOR SELECT
USING (is_active = true);

-- Admins can manage hero slides
CREATE POLICY "Admins can manage hero slides"
ON public.hero_slides
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Payment Transactions Policies
-- =====================

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Users can view their own transactions
CREATE POLICY "Users can view their own transactions"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.order_number = payment_transactions.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- System can insert transactions
CREATE POLICY "System can create transactions"
ON public.payment_transactions
FOR INSERT
WITH CHECK (true);

-- =====================
-- Analytics Events Policies
-- =====================

-- Anyone can insert analytics events
CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events
FOR INSERT
WITH CHECK (true);

-- Admins can view all analytics
CREATE POLICY "Admins can view all analytics"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Security Events Policies
-- =====================

-- Only admins can view security events
CREATE POLICY "Only admins can view security events"
ON public.security_events
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- System can insert security events
CREATE POLICY "System can create security events"
ON public.security_events
FOR INSERT
WITH CHECK (true);

-- Admins can manage security events
CREATE POLICY "Admins can manage security events"
ON public.security_events
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Coupon Usage Policies
-- =====================

-- Admins can view all coupon usage
CREATE POLICY "Admins can view all coupon usage"
ON public.coupon_usage
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Users can view their own coupon usage
CREATE POLICY "Users can view their own coupon usage"
ON public.coupon_usage
FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM public.customers 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- System can insert coupon usage
CREATE POLICY "System can create coupon usage"
ON public.coupon_usage
FOR INSERT
WITH CHECK (true);

-- Admins can manage coupon usage
CREATE POLICY "Admins can manage coupon usage"
ON public.coupon_usage
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Addresses Policies
-- =====================

-- Users can view their own addresses
CREATE POLICY "Users can view their own addresses"
ON public.addresses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own addresses
CREATE POLICY "Users can insert their own addresses"
ON public.addresses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own addresses
CREATE POLICY "Users can update their own addresses"
ON public.addresses
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own addresses
CREATE POLICY "Users can delete their own addresses"
ON public.addresses
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can manage all addresses
CREATE POLICY "Admins can manage all addresses"
ON public.addresses
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Product Recommendations Policies
-- =====================

-- Public can view product recommendations
CREATE POLICY "Public can view product recommendations"
ON public.product_recommendations
FOR SELECT
USING (true);

-- Admins can manage product recommendations
CREATE POLICY "Admins can manage product recommendations"
ON public.product_recommendations
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Discount Coupons Policies
-- =====================

-- Public can view active coupons
CREATE POLICY "Public can view active coupons"
ON public.discount_coupons
FOR SELECT
USING (is_active = true);

-- Admins can view all coupons
CREATE POLICY "Admins can view all coupons"
ON public.discount_coupons
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Admins can manage coupons
CREATE POLICY "Admins can manage coupons"
ON public.discount_coupons
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Store Settings Policies
-- =====================

-- Public can view store settings
CREATE POLICY "Public can view store settings"
ON public.store_settings
FOR SELECT
USING (true);

-- Admins can manage store settings
CREATE POLICY "Admins can manage store settings"
ON public.store_settings
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Sliders Policies
-- =====================

-- Public can view active sliders
CREATE POLICY "Public can view active sliders"
ON public.sliders
FOR SELECT
USING (is_active = true);

-- Admins can manage sliders
CREATE POLICY "Admins can manage sliders"
ON public.sliders
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Homepage Sections Policies
-- =====================

-- Public can view active homepage sections
CREATE POLICY "Public can view active homepage sections"
ON public.homepage_sections
FOR SELECT
USING (is_active = true);

-- Admins can manage homepage sections
CREATE POLICY "Admins can manage homepage sections"
ON public.homepage_sections
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Payment Methods Policies
-- =====================

-- Public can view active payment methods
CREATE POLICY "Public can view active payment methods"
ON public.payment_methods
FOR SELECT
USING (is_active = true);

-- Admins can manage payment methods
CREATE POLICY "Admins can manage payment methods"
ON public.payment_methods
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Payment Offers Policies
-- =====================

-- Public can view active payment offers
CREATE POLICY "Public can view active payment offers"
ON public.payment_offers
FOR SELECT
USING (is_active = true);

-- Admins can manage payment offers
CREATE POLICY "Admins can manage payment offers"
ON public.payment_offers
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Payment Logs Policies
-- =====================

-- Only admins can view payment logs
CREATE POLICY "Only admins can view payment logs"
ON public.payment_logs
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- System can insert payment logs
CREATE POLICY "System can insert payment logs"
ON public.payment_logs
FOR INSERT
WITH CHECK (true);

-- =====================
-- Payment Webhooks Policies
-- =====================

-- Only admins can view payment webhooks
CREATE POLICY "Only admins can view payment webhooks"
ON public.payment_webhooks
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- System can insert payment webhooks
CREATE POLICY "System can insert payment webhooks"
ON public.payment_webhooks
FOR INSERT
WITH CHECK (true);

-- Admins can manage payment webhooks
CREATE POLICY "Admins can manage payment webhooks"
ON public.payment_webhooks
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Payment Refunds Policies
-- =====================

-- Only admins can view payment refunds
CREATE POLICY "Only admins can view payment refunds"
ON public.payment_refunds
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- System can insert payment refunds
CREATE POLICY "System can insert payment refunds"
ON public.payment_refunds
FOR INSERT
WITH CHECK (true);

-- Admins can manage payment refunds
CREATE POLICY "Admins can manage payment refunds"
ON public.payment_refunds
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Payment Rate Limits Policies
-- =====================

-- Only admins can view rate limits
CREATE POLICY "Only admins can view rate limits"
ON public.payment_rate_limits
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- System can manage rate limits
CREATE POLICY "System can manage rate limits"
ON public.payment_rate_limits
FOR ALL
WITH CHECK (true);

-- =====================
-- Fraud Rules Policies
-- =====================

-- Only admins can view fraud rules
CREATE POLICY "Only admins can view fraud rules"
ON public.fraud_rules
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Admins can manage fraud rules
CREATE POLICY "Admins can manage fraud rules"
ON public.fraud_rules
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Shipping Zones Policies
-- =====================

-- Public can view active shipping zones
CREATE POLICY "Public can view active shipping zones"
ON public.shipping_zones
FOR SELECT
USING (is_active = true);

-- Admins can view all shipping zones
CREATE POLICY "Admins can view all shipping zones"
ON public.shipping_zones
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Admins can manage shipping zones
CREATE POLICY "Admins can manage shipping zones"
ON public.shipping_zones
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =====================
-- Admins Table Policies
-- =====================

-- Only admins can view admins table
CREATE POLICY "Only admins can view admins table"
ON public.admins
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Only admins can manage admins table
CREATE POLICY "Only admins can manage admins table"
ON public.admins
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =============================================================================
-- Step 7: Create Storage Buckets and Policies
-- =============================================================================

-- Note: Storage buckets are managed by Supabase Storage API
-- These policies apply to the storage.objects table

-- Products bucket setup
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Allow public to read product images
CREATE POLICY "Public can read product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- Allow authenticated admins to upload product images
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow authenticated admins to update product images
CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'products' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow authenticated admins to delete product images
CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'products' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Categories bucket setup
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'categories',
  'categories',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Allow public to read category images
CREATE POLICY "Public can read category images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'categories');

-- Allow authenticated admins to upload category images
CREATE POLICY "Admins can upload category images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'categories' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow authenticated admins to update category images
CREATE POLICY "Admins can update category images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'categories' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow authenticated admins to delete category images
CREATE POLICY "Admins can delete category images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'categories' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Pages bucket setup (for logos, hero images, and page content)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pages',
  'pages',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Allow public to read page images
CREATE POLICY "Public can read page images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'pages');

-- Allow authenticated admins to upload page images
CREATE POLICY "Admins can upload page images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pages' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow authenticated admins to update page images
CREATE POLICY "Admins can update page images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pages' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow authenticated admins to delete page images
CREATE POLICY "Admins can delete page images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pages' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =============================================================================
-- Step 8: Create Triggers for Updated_at
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
    BEFORE UPDATE ON public.cart_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_reviews_updated_at
    BEFORE UPDATE ON public.product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_settings_updated_at
    BEFORE UPDATE ON public.store_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_design_settings_updated_at
    BEFORE UPDATE ON public.design_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hero_slides_updated_at
    BEFORE UPDATE ON public.hero_slides
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sliders_updated_at
    BEFORE UPDATE ON public.sliders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_homepage_sections_updated_at
    BEFORE UPDATE ON public.homepage_sections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_page_content_updated_at
    BEFORE UPDATE ON public.page_content
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_offers_updated_at
    BEFORE UPDATE ON public.payment_offers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shipping_zones_updated_at
    BEFORE UPDATE ON public.shipping_zones
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fraud_rules_updated_at
    BEFORE UPDATE ON public.fraud_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_security_events_updated_at
    BEFORE UPDATE ON public.security_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- Step 8: Grant Permissions (للأمان)
-- =============================================================================

-- Grant SELECT on all tables to authenticated users
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

-- Grant INSERT on contact messages to everyone
GRANT INSERT ON public.contact_messages TO authenticated, anon;

-- =============================================================================
-- تم! قاعدة البيانات جاهزة بالكامل مع RLS و Indexes و Triggers و Storage
-- Done! Database is fully ready with RLS, Indexes, Triggers, and Storage
-- =============================================================================

-- ✅ 33 Tables Created with all columns
-- ✅ Foreign Keys Added
-- ✅ Indexes Created for Performance
-- ✅ RLS Enabled on ALL Tables (33 tables)
-- ✅ RLS Policies Configured (matching original database patterns)
-- ✅ Storage Buckets Created (products, categories, pages)
-- ✅ Storage Policies Configured
-- ✅ Triggers for Updated_at (17 triggers)
-- ✅ Permissions Granted

-- =============================================================================
-- IMPORTANT NOTES / ملاحظات مهمة
-- =============================================================================

-- 1. After running this script, you need to:
--    بعد تشغيل هذا السكريبت، تحتاج إلى:
--    - Create admin profile in profiles table with role='admin'
--      إنشاء ملف تعريف للمسؤول في جدول profiles مع role='admin'
--    - Upload initial product/category images to storage buckets
--      رفع صور المنتجات والفئات الأولية إلى buckets التخزين

-- 2. Storage Buckets (products, categories, pages) are created automatically
--    buckets التخزين (products, categories, pages) يتم إنشاؤها تلقائيًا

-- 3. All RLS policies use profiles.role='admin' for admin checks
--    جميع سياسات RLS تستخدم profiles.role='admin' للتحقق من المسؤولين

-- 4. The admins table is kept for backward compatibility but not used in RLS
--    جدول admins محفوظ للتوافق العكسي لكن غير مستخدم في RLS

-- 5. To create your first admin user, run this after registration:
--    لإنشاء مستخدم مسؤول أول، قم بتشغيل هذا بعد التسجيل:
--    UPDATE public.profiles SET role = 'admin' WHERE id = 'USER_UUID_HERE';

-- =============================================================================
-- END OF SCRIPT / نهاية السكريبت
-- =============================================================================
