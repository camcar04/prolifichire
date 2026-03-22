
CREATE TABLE public.job_actuals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  operator_id uuid NOT NULL,
  actual_hours numeric DEFAULT 0,
  actual_travel_miles numeric DEFAULT 0,
  actual_acres numeric DEFAULT 0,
  actual_loads integer DEFAULT 0,
  actual_fuel_cost numeric DEFAULT 0,
  actual_labor_cost numeric DEFAULT 0,
  actual_equipment_cost numeric DEFAULT 0,
  actual_other_cost numeric DEFAULT 0,
  actual_total_cost numeric DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, operator_id)
);

ALTER TABLE public.job_actuals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Actuals own manage" ON public.job_actuals
  FOR ALL TO authenticated
  USING (operator_id = auth.uid())
  WITH CHECK (operator_id = auth.uid());

CREATE POLICY "Actuals admin select" ON public.job_actuals
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role));

CREATE TRIGGER update_job_actuals_updated_at
  BEFORE UPDATE ON public.job_actuals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
