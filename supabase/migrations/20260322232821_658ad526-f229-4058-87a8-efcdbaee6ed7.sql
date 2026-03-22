
-- Job posting confirmations
CREATE TABLE public.job_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text,
  UNIQUE(job_id)
);

ALTER TABLE public.job_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Confirmations own" ON public.job_confirmations
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Confirmations select" ON public.job_confirmations
  FOR SELECT TO authenticated
  USING (true);

-- Job reports
CREATE TABLE public.job_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  reported_by uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reports own" ON public.job_reports
  FOR ALL TO authenticated
  USING (reported_by = auth.uid() OR has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (reported_by = auth.uid());

CREATE POLICY "Reports admin select" ON public.job_reports
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role));

-- Poster stats view (materialized as a function for now)
CREATE OR REPLACE FUNCTION public.get_poster_stats(_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_build_object(
    'total_posted', (SELECT count(*) FROM jobs WHERE requested_by = _user_id),
    'total_completed', (SELECT count(*) FROM jobs WHERE requested_by = _user_id AND status IN ('completed', 'approved', 'paid', 'closed')),
    'total_cancelled', (SELECT count(*) FROM jobs WHERE requested_by = _user_id AND status = 'cancelled'),
    'total_paid', (SELECT COALESCE(sum(total), 0) FROM invoices i JOIN jobs j ON j.id = i.job_id WHERE j.requested_by = _user_id AND i.status = 'paid'),
    'avg_response_hours', 24
  )
$$;
