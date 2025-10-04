-- Create payment_orders table to track Cashfree payments
CREATE TABLE IF NOT EXISTS public.payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL,
  plan_name text NOT NULL,
  amount numeric(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  billing_cycle text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  cashfree_order_id text,
  payment_method text,
  transaction_id text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own payment orders"
  ON public.payment_orders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert payment orders"
  ON public.payment_orders
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update payment orders"
  ON public.payment_orders
  FOR UPDATE
  USING (true);

-- Create index for faster lookups
CREATE INDEX idx_payment_orders_user_id ON public.payment_orders(user_id);
CREATE INDEX idx_payment_orders_order_id ON public.payment_orders(order_id);
CREATE INDEX idx_payment_orders_status ON public.payment_orders(status);

-- Trigger to update updated_at
CREATE TRIGGER update_payment_orders_updated_at
  BEFORE UPDATE ON public.payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();