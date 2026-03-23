
-- Create funding_status enum
CREATE TYPE public.funding_status AS ENUM (
  'not_required',
  'unfunded',
  'funding_required',
  'funded',
  'payout_ready',
  'payout_released',
  'disputed',
  'refunded',
  'cancelled'
);

-- Add funding columns to jobs table
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS funding_status public.funding_status NOT NULL DEFAULT 'unfunded',
  ADD COLUMN IF NOT EXISTS agreed_price numeric NULL,
  ADD COLUMN IF NOT EXISTS funded_amount numeric NULL,
  ADD COLUMN IF NOT EXISTS funded_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS platform_fee_rate numeric NOT NULL DEFAULT 0.05,
  ADD COLUMN IF NOT EXISTS platform_fee_amount numeric NULL;

-- Add quote negotiation history table
CREATE TABLE IF NOT EXISTS public.quote_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL,
  action text NOT NULL,
  amount numeric NOT NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quote_history ENABLE ROW LEVEL SECURITY;

-- RLS: participants can view quote history
CREATE POLICY "Quote history select" ON public.quote_history
  FOR SELECT TO authenticated
  USING (
    actor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = quote_history.job_id
        AND (j.requested_by = auth.uid() OR j.operator_id = auth.uid())
    )
    OR has_role(auth.uid(), 'admin'::user_role)
  );

-- RLS: authenticated users can insert history entries
CREATE POLICY "Quote history insert" ON public.quote_history
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());
