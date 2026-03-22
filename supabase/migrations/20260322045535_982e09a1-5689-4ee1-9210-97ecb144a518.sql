
-- Add contract_mode to jobs
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS contract_mode text NOT NULL DEFAULT 'fixed_price';
-- Add response_deadline to jobs
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS response_deadline timestamp with time zone;

-- Create invited_operators table
CREATE TABLE IF NOT EXISTS public.invited_operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  operator_id uuid NOT NULL,
  invited_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending',
  UNIQUE(job_id, operator_id)
);

ALTER TABLE public.invited_operators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invited ops select" ON public.invited_operators FOR SELECT TO authenticated
  USING (operator_id = auth.uid() OR EXISTS (SELECT 1 FROM jobs j WHERE j.id = invited_operators.job_id AND j.requested_by = auth.uid()) OR has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Invited ops insert" ON public.invited_operators FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM jobs j WHERE j.id = invited_operators.job_id AND j.requested_by = auth.uid()) OR has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Invited ops update" ON public.invited_operators FOR UPDATE TO authenticated
  USING (operator_id = auth.uid() OR EXISTS (SELECT 1 FROM jobs j WHERE j.id = invited_operators.job_id AND j.requested_by = auth.uid()) OR has_role(auth.uid(), 'admin'::user_role));
