
-- Job execution updates (operator status reports)
CREATE TABLE public.job_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'note',
  note text,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Job updates insert" ON public.job_updates
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Job updates select" ON public.job_updates
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM jobs j WHERE j.id = job_updates.job_id AND (j.requested_by = auth.uid() OR j.operator_id = auth.uid()))
    OR has_role(auth.uid(), 'admin'::user_role)
  );

-- Proof of work submissions
CREATE TABLE public.proof_of_work (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending_review',
  notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.proof_of_work ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Proof insert" ON public.proof_of_work
  FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Proof select" ON public.proof_of_work
  FOR SELECT TO authenticated
  USING (
    submitted_by = auth.uid()
    OR EXISTS (SELECT 1 FROM jobs j WHERE j.id = proof_of_work.job_id AND (j.requested_by = auth.uid() OR j.operator_id = auth.uid()))
    OR has_role(auth.uid(), 'admin'::user_role)
  );

CREATE POLICY "Proof update" ON public.proof_of_work
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM jobs j WHERE j.id = proof_of_work.job_id AND j.requested_by = auth.uid())
    OR has_role(auth.uid(), 'admin'::user_role)
  );

-- Proof attachments
CREATE TABLE public.proof_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_id uuid NOT NULL REFERENCES public.proof_of_work(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL DEFAULT 'image',
  file_size bigint DEFAULT 0,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.proof_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Proof files select" ON public.proof_files
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proof_of_work pow
      JOIN jobs j ON j.id = pow.job_id
      WHERE pow.id = proof_files.proof_id
        AND (pow.submitted_by = auth.uid() OR j.requested_by = auth.uid() OR j.operator_id = auth.uid() OR has_role(auth.uid(), 'admin'::user_role))
    )
  );

CREATE POLICY "Proof files insert" ON public.proof_files
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM proof_of_work pow WHERE pow.id = proof_files.proof_id AND pow.submitted_by = auth.uid())
  );

-- Enable realtime for job_updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_updates;
