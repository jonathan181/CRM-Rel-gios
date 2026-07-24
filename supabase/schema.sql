-- ==============================================================================
-- SUPABASE MIGRATION SCRIPT FOR HOROLOGICAL PRECISION
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  name TEXT,
  email TEXT NOT NULL UNIQUE,
  password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Watches Table
CREATE TABLE IF NOT EXISTS public.watches (
  id TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
  user_uid TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  ref TEXT NOT NULL,
  serial_number TEXT,
  condition TEXT NOT NULL,
  purchase_date TEXT NOT NULL,
  purchase_currency TEXT NOT NULL,
  purchase_price DOUBLE PRECISION NOT NULL,
  freight_cost DOUBLE PRECISION NOT NULL,
  exchange_rate DOUBLE PRECISION NOT NULL,
  taxes_brl DOUBLE PRECISION NOT NULL,
  total_cost_brl DOUBLE PRECISION NOT NULL,
  supplier TEXT NOT NULL,
  notes_and_specs TEXT,
  images JSONB DEFAULT '[]'::jsonb NOT NULL,
  status TEXT NOT NULL,
  market_price_brl DOUBLE PRECISION,
  sale_price_brl DOUBLE PRECISION,
  sale_price_usd DOUBLE PRECISION,
  sale_date TEXT,
  shipping_and_fees_brl DOUBLE PRECISION,
  buyer_name TEXT,
  buyer_contact TEXT,
  sale_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_users_uid ON public.users(uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_watches_user_uid ON public.watches(user_uid);
CREATE INDEX IF NOT EXISTS idx_watches_status ON public.watches(status);

-- 4. Enable Row Level Security (RLS) - Optional/Recommended
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watches ENABLE ROW LEVEL SECURITY;

-- Allow public service role / app queries (or customize as needed)
CREATE POLICY "Allow public read/write access for app API" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access for app API" ON public.watches FOR ALL USING (true) WITH CHECK (true);
