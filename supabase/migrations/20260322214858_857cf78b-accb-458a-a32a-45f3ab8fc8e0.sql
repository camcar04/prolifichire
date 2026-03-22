-- CRITICAL FIX: Allow operators to see marketplace jobs (public/posted jobs)
-- Currently jobs SELECT policy only shows own jobs or assigned operator jobs
-- Operators need to see posted jobs to browse the marketplace

-- Add marketplace visibility policy
CREATE POLICY "Marketplace jobs visible to authenticated"
ON public.jobs FOR SELECT
TO authenticated
USING (
  status IN ('requested', 'quoted', 'scheduled')
  AND contract_mode != 'invite_only'
);

-- Add visibility column to jobs for future private/network filtering
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';

-- Allow operators to update quotes (needed for counter-offer flow)
CREATE POLICY "Quotes update by operator"
ON public.quotes FOR UPDATE
TO authenticated
USING (operator_id = auth.uid())
WITH CHECK (operator_id = auth.uid());

-- Allow dataset_assets SELECT for operators via job access
CREATE POLICY "Dataset assets via job"
ON public.dataset_assets FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM job_fields jf
    JOIN jobs j ON j.id = jf.job_id
    WHERE jf.field_id = dataset_assets.field_id
    AND (j.operator_id = auth.uid() OR j.requested_by = auth.uid())
  )
  OR has_role(auth.uid(), 'admin'::user_role)
);

-- Allow field_packets INSERT for job owners (auto-generate on accept)
CREATE POLICY "Packets insert by job owner"
ON public.field_packets FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jobs j WHERE j.id = job_id AND (j.requested_by = auth.uid() OR j.operator_id = auth.uid())
  )
  OR has_role(auth.uid(), 'admin'::user_role)
);

-- Allow field_packets UPDATE by operator or job owner
CREATE POLICY "Packets update by participants"
ON public.field_packets FOR UPDATE
TO authenticated
USING (
  operator_id = auth.uid()
  OR EXISTS (SELECT 1 FROM jobs j WHERE j.id = job_id AND j.requested_by = auth.uid())
  OR has_role(auth.uid(), 'admin'::user_role)
);