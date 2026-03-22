
-- Labor job types enum
CREATE TYPE public.labor_job_type AS ENUM ('full_time', 'seasonal', 'part_time', 'task');
CREATE TYPE public.labor_application_status AS ENUM ('applied', 'reviewing', 'accepted', 'rejected', 'withdrawn');

-- Worker profiles
CREATE TABLE public.worker_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  bio text,
  base_lat numeric,
  base_lng numeric,
  base_address text,
  base_city text,
  base_state text,
  travel_radius integer DEFAULT 50,
  availability_status text NOT NULL DEFAULT 'available',
  skills text[] DEFAULT '{}',
  certifications text[] DEFAULT '{}',
  years_experience integer DEFAULT 0,
  work_preferences text[] DEFAULT '{}',
  equipment_experience text[] DEFAULT '{}',
  available_from date,
  available_to date,
  hours_per_day integer,
  flexibility text DEFAULT 'flexible',
  visibility text NOT NULL DEFAULT 'public',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Worker profiles own manage" ON public.worker_profiles
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Worker profiles public select" ON public.worker_profiles
  FOR SELECT TO authenticated
  USING (visibility = 'public' OR user_id = auth.uid() OR has_role(auth.uid(), 'admin'::user_role));

-- Labor jobs
CREATE TABLE public.labor_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by uuid NOT NULL REFERENCES auth.users(id),
  farm_id uuid REFERENCES public.farms(id),
  job_type labor_job_type NOT NULL DEFAULT 'seasonal',
  title text NOT NULL,
  description text,
  responsibilities text,
  required_skills text[] DEFAULT '{}',
  required_certifications text[] DEFAULT '{}',
  experience_level text DEFAULT 'any',
  location_address text,
  location_city text,
  location_state text,
  location_lat numeric,
  location_lng numeric,
  start_date date,
  end_date date,
  hours_per_day integer,
  schedule_flexibility text DEFAULT 'fixed',
  compensation_type text NOT NULL DEFAULT 'hourly',
  compensation_min numeric,
  compensation_max numeric,
  housing_provided boolean DEFAULT false,
  equipment_required text[] DEFAULT '{}',
  visibility text NOT NULL DEFAULT 'public',
  status text NOT NULL DEFAULT 'open',
  applicant_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.labor_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Labor jobs own manage" ON public.labor_jobs
  FOR ALL TO authenticated
  USING (posted_by = auth.uid() OR has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (posted_by = auth.uid() OR has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Labor jobs public select" ON public.labor_jobs
  FOR SELECT TO authenticated
  USING (visibility = 'public' OR posted_by = auth.uid() OR has_role(auth.uid(), 'admin'::user_role));

-- Labor applications
CREATE TABLE public.labor_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  labor_job_id uuid NOT NULL REFERENCES public.labor_jobs(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES auth.users(id),
  status labor_application_status NOT NULL DEFAULT 'applied',
  cover_note text,
  applied_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  UNIQUE(labor_job_id, worker_id)
);

ALTER TABLE public.labor_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applications own manage" ON public.labor_applications
  FOR ALL TO authenticated
  USING (worker_id = auth.uid() OR has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (worker_id = auth.uid() OR has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Applications job owner select" ON public.labor_applications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.labor_jobs lj
      WHERE lj.id = labor_applications.labor_job_id
      AND lj.posted_by = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::user_role)
  );

CREATE POLICY "Applications job owner update" ON public.labor_applications
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.labor_jobs lj
      WHERE lj.id = labor_applications.labor_job_id
      AND lj.posted_by = auth.uid()
    )
  );
