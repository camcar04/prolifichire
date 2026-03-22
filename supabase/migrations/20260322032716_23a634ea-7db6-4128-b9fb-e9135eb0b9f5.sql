
CREATE TABLE public.job_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  operation_type public.operation_type NOT NULL,
  crop public.crop_type DEFAULT 'other',
  pricing_model public.pricing_model DEFAULT 'per_acre',
  base_rate NUMERIC DEFAULT 0,
  urgency TEXT DEFAULT 'normal',
  spec_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  required_files TEXT[] DEFAULT '{}'::text[],
  contract_defaults JSONB DEFAULT '{}'::jsonb,
  comm_defaults JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  requirements TEXT,
  is_shared BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates own" ON public.job_templates FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR (is_shared = true) OR has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_job_templates_updated_at BEFORE UPDATE ON public.job_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
