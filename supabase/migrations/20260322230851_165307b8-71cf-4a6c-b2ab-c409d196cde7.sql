-- Allow job owners (growers) to update quote status (accept/reject/counter)
CREATE POLICY "Quotes update by job owner"
ON public.quotes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.id = quotes.job_id
    AND j.requested_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.id = quotes.job_id
    AND j.requested_by = auth.uid()
  )
);