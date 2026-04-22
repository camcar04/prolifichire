
-- Extend proof_of_work with submission details
ALTER TABLE public.proof_of_work
  ADD COLUMN IF NOT EXISTS actual_acres numeric,
  ADD COLUMN IF NOT EXISTS completion_date date,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS revision_requested_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

-- Photos / attachments for proof submissions
CREATE TABLE IF NOT EXISTS public.proof_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_id uuid NOT NULL REFERENCES public.proof_of_work(id) ON DELETE CASCADE,
  job_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  mime_type text,
  kind text NOT NULL DEFAULT 'photo', -- 'photo' | 'iso_xml' | 'gpx' | 'other'
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proof_photos_proof_id ON public.proof_photos(proof_id);
CREATE INDEX IF NOT EXISTS idx_proof_photos_job_id ON public.proof_photos(job_id);

ALTER TABLE public.proof_photos ENABLE ROW LEVEL SECURITY;

-- Job participants (grower or operator) and admins can view
CREATE POLICY "Proof photos select" ON public.proof_photos
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = proof_photos.job_id
      AND (j.requested_by = auth.uid() OR j.operator_id = auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin'::public.user_role)
);

-- Operator (uploader) can insert their own rows for jobs they're assigned to
CREATE POLICY "Proof photos insert" ON public.proof_photos
FOR INSERT TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = proof_photos.job_id AND j.operator_id = auth.uid()
  )
);

-- Uploader can delete their own (e.g., remove before submit)
CREATE POLICY "Proof photos delete own" ON public.proof_photos
FOR DELETE TO authenticated
USING (uploaded_by = auth.uid());

-- Storage bucket for proof photos (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('proof-photos', 'proof-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: path layout = <job_id>/<proof_id>/<filename>
-- Operator on the job can upload
CREATE POLICY "Proof photos storage insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'proof-photos'
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id::text = (storage.foldername(name))[1]
      AND j.operator_id = auth.uid()
  )
);

-- Job participants + admins can read
CREATE POLICY "Proof photos storage select" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'proof-photos'
  AND (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id::text = (storage.foldername(name))[1]
        AND (j.requested_by = auth.uid() OR j.operator_id = auth.uid())
    )
    OR public.has_role(auth.uid(), 'admin'::public.user_role)
  )
);

-- Operator can delete pre-submission
CREATE POLICY "Proof photos storage delete own" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'proof-photos'
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id::text = (storage.foldername(name))[1]
      AND j.operator_id = auth.uid()
  )
);

-- Trigger: when proof is approved or revision requested, update job state
CREATE OR REPLACE FUNCTION public.handle_proof_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND COALESCE(OLD.status, '') <> 'approved' THEN
    NEW.approved_at := now();
    UPDATE public.jobs
       SET status = 'approved',
           proof_approved = true,
           approved_at = now(),
           approved_by = NEW.reviewed_by
     WHERE id = NEW.job_id;
  ELSIF NEW.status = 'revision_requested' AND COALESCE(OLD.status, '') <> 'revision_requested' THEN
    NEW.revision_requested_at := now();
    UPDATE public.jobs
       SET status = 'in_progress',
           proof_submitted = false,
           proof_approved = false
     WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_proof_review ON public.proof_of_work;
CREATE TRIGGER trg_handle_proof_review
BEFORE UPDATE OF status ON public.proof_of_work
FOR EACH ROW
EXECUTE FUNCTION public.handle_proof_review();

-- Trigger: notify grower when operator submits (or resubmits) proof
CREATE OR REPLACE FUNCTION public.notify_proof_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _grower uuid;
  _display text;
BEGIN
  SELECT requested_by, COALESCE(display_id, id::text)
    INTO _grower, _display
    FROM public.jobs
   WHERE id = NEW.job_id;

  IF _grower IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, action_url, read)
    VALUES (
      _grower,
      'action',
      'Proof of work submitted',
      'Operator submitted proof for job ' || _display || '. Review and approve.',
      '/jobs/' || NEW.job_id,
      false
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_proof_submitted ON public.proof_of_work;
CREATE TRIGGER trg_notify_proof_submitted
AFTER INSERT ON public.proof_of_work
FOR EACH ROW
EXECUTE FUNCTION public.notify_proof_submitted();
