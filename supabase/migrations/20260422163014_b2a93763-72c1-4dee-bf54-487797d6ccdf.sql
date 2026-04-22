ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS grower_charge_cents integer,
  ADD COLUMN IF NOT EXISTS operator_payout_cents integer,
  ADD COLUMN IF NOT EXISTS platform_fee_cents integer,
  ADD COLUMN IF NOT EXISTS stripe_fee_cents integer,
  ADD COLUMN IF NOT EXISTS stripe_transfer_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;