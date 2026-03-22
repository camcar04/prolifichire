
-- Add grain_hauling to operation_type enum
ALTER TYPE public.operation_type ADD VALUE IF NOT EXISTS 'grain_hauling';

-- Add per_load, per_bushel, per_mile, day_rate to pricing_model enum
ALTER TYPE public.pricing_model ADD VALUE IF NOT EXISTS 'per_load';
ALTER TYPE public.pricing_model ADD VALUE IF NOT EXISTS 'per_bushel';
ALTER TYPE public.pricing_model ADD VALUE IF NOT EXISTS 'per_mile';
ALTER TYPE public.pricing_model ADD VALUE IF NOT EXISTS 'day_rate';

-- Truck units owned by operators
CREATE TABLE public.truck_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_profile_id uuid NOT NULL REFERENCES public.operator_profiles(id) ON DELETE CASCADE,
  truck_type text NOT NULL DEFAULT 'semi',
  make text,
  model text,
  year integer,
  capacity_bushels integer,
  capacity_tons numeric,
  license_plate text,
  status text NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.truck_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Truck units own" ON public.truck_units FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM operator_profiles op WHERE op.id = truck_units.operator_profile_id AND op.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Truck units viewable" ON public.truck_units FOR SELECT TO authenticated USING (true);

-- Hauling job details (extends jobs table conceptually)
CREATE TABLE public.hauling_job_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE UNIQUE,
  trucks_needed integer NOT NULL DEFAULT 1,
  trucks_assigned integer NOT NULL DEFAULT 0,
  schedule_model text NOT NULL DEFAULT 'full_day',
  delivery_location_name text,
  delivery_address text,
  delivery_lat numeric,
  delivery_lng numeric,
  estimated_distance_miles numeric,
  estimated_cycle_minutes integer,
  expected_loads_per_day integer,
  scale_ticket_required boolean DEFAULT false,
  unload_instructions text,
  moisture_notes text,
  harvest_conditions text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hauling_job_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hauling details manage" ON public.hauling_job_details FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM jobs j WHERE j.id = hauling_job_details.job_id AND (j.requested_by = auth.uid() OR j.operator_id = auth.uid())) OR has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Hauling details select" ON public.hauling_job_details FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM jobs j WHERE j.id = hauling_job_details.job_id AND (j.requested_by = auth.uid() OR j.operator_id = auth.uid())) OR has_role(auth.uid(), 'admin'::user_role));

-- Truck assignments to hauling jobs
CREATE TABLE public.hauling_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  truck_id uuid REFERENCES public.truck_units(id),
  operator_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'assigned',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  loads_completed integer DEFAULT 0,
  notes text
);
ALTER TABLE public.hauling_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hauling assignments manage" ON public.hauling_assignments FOR ALL TO authenticated
  USING (operator_id = auth.uid() OR EXISTS (SELECT 1 FROM jobs j WHERE j.id = hauling_assignments.job_id AND j.requested_by = auth.uid()) OR has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Hauling assignments select" ON public.hauling_assignments FOR SELECT TO authenticated
  USING (operator_id = auth.uid() OR EXISTS (SELECT 1 FROM jobs j WHERE j.id = hauling_assignments.job_id AND (j.requested_by = auth.uid() OR j.operator_id = auth.uid())) OR has_role(auth.uid(), 'admin'::user_role));

-- Truck availability windows
CREATE TABLE public.truck_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id uuid NOT NULL REFERENCES public.truck_units(id) ON DELETE CASCADE,
  operator_profile_id uuid NOT NULL REFERENCES public.operator_profiles(id) ON DELETE CASCADE,
  available_date date NOT NULL,
  start_time time,
  end_time time,
  is_available boolean DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.truck_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Truck availability own" ON public.truck_availability FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM operator_profiles op WHERE op.id = truck_availability.operator_profile_id AND op.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Truck availability viewable" ON public.truck_availability FOR SELECT TO authenticated USING (true);
