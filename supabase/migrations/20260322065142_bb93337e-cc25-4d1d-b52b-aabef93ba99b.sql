-- Add cancellation fields to jobs
ALTER TABLE public.jobs 
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid,
  ADD COLUMN IF NOT EXISTS cancel_fee_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_edited_by uuid;

-- Job edit history table
CREATE TABLE IF NOT EXISTS public.job_edit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  edited_by uuid NOT NULL,
  edited_at timestamptz NOT NULL DEFAULT now(),
  change_type text NOT NULL,
  previous_value jsonb DEFAULT '{}'::jsonb,
  new_value jsonb DEFAULT '{}'::jsonb,
  requires_acknowledgment boolean DEFAULT false,
  acknowledged_at timestamptz,
  acknowledged_by uuid
);

ALTER TABLE public.job_edit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Edit history select" ON public.job_edit_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM jobs j WHERE j.id = job_edit_history.job_id AND (j.requested_by = auth.uid() OR j.operator_id = auth.uid()))
    OR has_role(auth.uid(), 'admin'::user_role)
  );

CREATE POLICY "Edit history insert" ON public.job_edit_history
  FOR INSERT TO authenticated
  WITH CHECK (edited_by = auth.uid() OR has_role(auth.uid(), 'admin'::user_role));