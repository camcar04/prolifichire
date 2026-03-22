
-- Job inputs / material items
CREATE TABLE public.job_inputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  product_type text NOT NULL DEFAULT 'chemical', -- 'seed', 'fertilizer', 'chemical', 'adjuvant', 'other'
  brand text,
  variant text,
  quantity numeric,
  unit text, -- 'bags', 'gallons', 'tons', 'lbs', 'units', 'oz'
  supplied_by text NOT NULL DEFAULT 'grower', -- 'grower', 'operator'
  pickup_required boolean NOT NULL DEFAULT false,
  pickup_location_name text,
  pickup_address text,
  pickup_city text,
  pickup_state text,
  pickup_zip text,
  pickup_lat numeric,
  pickup_lng numeric,
  pickup_contact text,
  pickup_phone text,
  pickup_instructions text,
  handling_notes text,
  safety_notes text,
  estimated_pickup_distance numeric, -- miles from operator base
  estimated_pickup_time integer, -- minutes
  sequence integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_inputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Job inputs select" ON public.job_inputs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_inputs.job_id
      AND (j.requested_by = auth.uid() OR j.operator_id = auth.uid())
    )
    OR has_role(auth.uid(), 'admin'::user_role)
  );

CREATE POLICY "Job inputs manage" ON public.job_inputs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_inputs.job_id
      AND (j.requested_by = auth.uid())
    )
    OR has_role(auth.uid(), 'admin'::user_role)
  );

CREATE TRIGGER update_job_inputs_updated_at
  BEFORE UPDATE ON public.job_inputs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
