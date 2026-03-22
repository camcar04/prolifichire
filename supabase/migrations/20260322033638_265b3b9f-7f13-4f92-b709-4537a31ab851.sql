
-- Pricing estimates table for AI-generated price suggestions
CREATE TABLE public.pricing_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  field_id uuid REFERENCES public.fields(id) ON DELETE CASCADE,
  operation_type public.operation_type NOT NULL,
  acreage numeric NOT NULL DEFAULT 0,
  travel_distance numeric DEFAULT NULL,
  urgency text NOT NULL DEFAULT 'normal',
  low_estimate numeric NOT NULL DEFAULT 0,
  recommended_estimate numeric NOT NULL DEFAULT 0,
  high_estimate numeric NOT NULL DEFAULT 0,
  base_rate numeric NOT NULL DEFAULT 0,
  travel_cost numeric DEFAULT 0,
  urgency_adjustment numeric DEFAULT 0,
  clustering_discount numeric DEFAULT 0,
  fill_likelihood text DEFAULT 'medium',
  price_drivers jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pricing estimates select" ON public.pricing_estimates FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Pricing estimates insert" ON public.pricing_estimates FOR INSERT TO authenticated
  WITH CHECK (true);

-- Add routing preferences columns to operator_profiles
ALTER TABLE public.operator_profiles 
  ADD COLUMN IF NOT EXISTS max_travel_distance integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS max_drive_time integer DEFAULT 120,
  ADD COLUMN IF NOT EXISTS min_acres_for_distant integer DEFAULT 40,
  ADD COLUMN IF NOT EXISTS routing_preference text DEFAULT 'balanced';
