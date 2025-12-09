-- Database schema for TCGPlaytest orders
-- This should be run in your Supabase SQL editor or database

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id TEXT UNIQUE NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  total_amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  quantity INTEGER NOT NULL,
  price_per_card DECIMAL(10, 2) NOT NULL,
  shipping_cost_cents INTEGER NOT NULL,
  shipping_country TEXT NOT NULL,
  card_images JSONB DEFAULT '[]'::jsonb, -- Stores ALL image URLs from Supabase Storage (front + back)
  card_images_base64 JSONB DEFAULT '[]'::jsonb, -- Backup: base64 images if storage upload fails
  card_data JSONB DEFAULT '[]'::jsonb, -- Stores card data with front/back URLs and metadata
  front_image_urls JSONB DEFAULT '[]'::jsonb, -- Front image URLs only (for easy admin access)
  back_image_urls JSONB DEFAULT '[]'::jsonb, -- Back image URLs only (for easy admin access)
  image_storage_path TEXT, -- Path in storage bucket: {orderId}/{timestamp}/{addressHash}
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on stripe_session_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);

-- Create index on customer_email for customer order history
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create webhook_events table for idempotency tracking
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY, -- Stripe event ID
  type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on processed_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON webhook_events(processed_at DESC);

