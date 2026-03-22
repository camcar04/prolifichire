
-- Add verification columns to existing equipment table
ALTER TABLE public.equipment 
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid,
  ADD COLUMN IF NOT EXISTS unit_name text,
  ADD COLUMN IF NOT EXISTS serial_number text,
  ADD COLUMN IF NOT EXISTS variable_rate boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS see_and_spray boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS row_count integer,
  ADD COLUMN IF NOT EXISTS row_spacing numeric,
  ADD COLUMN IF NOT EXISTS boom_width_ft numeric,
  ADD COLUMN IF NOT EXISTS tank_size_gal numeric,
  ADD COLUMN IF NOT EXISTS hopper_capacity_bu integer,
  ADD COLUMN IF NOT EXISTS hauling_capacity_tons numeric,
  ADD COLUMN IF NOT EXISTS precision_compatible text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notes text;

-- Equipment documents table for proof uploads
CREATE TABLE IF NOT EXISTS public.equipment_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL DEFAULT 'photo',
  file_size bigint DEFAULT 0,
  uploaded_by uuid NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

ALTER TABLE public.equipment_documents ENABLE ROW LEVEL SECURITY;

-- Equipment docs: owner can manage, all authenticated can view
CREATE POLICY "Equipment docs own" ON public.equipment_documents
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM equipment e
      JOIN operator_profiles op ON op.id = e.operator_id
      WHERE e.id = equipment_documents.equipment_id AND op.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::user_role)
  );

CREATE POLICY "Equipment docs select" ON public.equipment_documents
  FOR SELECT TO authenticated
  USING (true);
