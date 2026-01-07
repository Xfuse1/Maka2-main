CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  items jsonb,
  total_price numeric,
  status text DEFAULT 'pending', -- حالات: pending, processing, shipped, delivered, cancelled
  created_at timestamp DEFAULT now()
);
