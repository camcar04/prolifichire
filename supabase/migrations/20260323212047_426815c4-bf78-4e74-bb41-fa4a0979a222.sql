-- Add stripe_account_id to profiles for Connect onboarding
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_onboarded boolean DEFAULT false;

-- Platform products table: maps Stripe products created on the platform account
-- to the connected account that owns them
CREATE TABLE IF NOT EXISTS public.platform_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  connected_account_id text,
  stripe_product_id text NOT NULL,
  stripe_price_id text,
  name text NOT NULL,
  description text,
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  pricing_type text NOT NULL DEFAULT 'one_time' CHECK (pricing_type IN ('one_time', 'recurring')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products own manage" ON public.platform_products
  FOR ALL TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Products public select" ON public.platform_products
  FOR SELECT TO authenticated
  USING (is_active = true OR created_by = auth.uid() OR has_role(auth.uid(), 'admin'::user_role));

CREATE TRIGGER update_platform_products_updated_at
  BEFORE UPDATE ON public.platform_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();