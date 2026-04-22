ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT,
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_jobs_payment_intent_id ON public.jobs(payment_intent_id) WHERE payment_intent_id IS NOT NULL;