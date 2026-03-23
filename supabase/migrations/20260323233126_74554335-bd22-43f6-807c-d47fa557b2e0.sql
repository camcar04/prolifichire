
-- Add operation_type and platform_fee_percent to platform_products
-- so each product can specify what kind of job it is and override the default fee
ALTER TABLE public.platform_products
  ADD COLUMN IF NOT EXISTS operation_type text DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS platform_fee_percent numeric DEFAULT 0.10;

-- Add a comment explaining the fee column
COMMENT ON COLUMN public.platform_products.platform_fee_percent IS 'Platform commission rate for this product (0.10 = 10%). Overrides the default when set.';
COMMENT ON COLUMN public.platform_products.operation_type IS 'The agricultural operation type this product represents (spraying, harvest, hauling, etc).';
