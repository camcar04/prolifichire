
-- Operator pricing profiles: stores private cost assumptions
CREATE TABLE public.operator_pricing_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_profile_id uuid NOT NULL REFERENCES public.operator_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  target_per_acre numeric DEFAULT 0,
  target_per_hour numeric DEFAULT 0,
  minimum_job_fee numeric DEFAULT 0,
  travel_fee_per_mile numeric DEFAULT 0,
  fuel_surcharge_pct numeric DEFAULT 0,
  hauling_cost_per_mile numeric DEFAULT 0,
  labor_cost_per_hour numeric DEFAULT 0,
  desired_margin_pct numeric DEFAULT 20,
  service_defaults jsonb DEFAULT '{}'::jsonb,
  equipment_costs jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.operator_pricing_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own pricing profile"
  ON public.operator_pricing_profiles FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
