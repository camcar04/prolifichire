
-- Operation spec types
CREATE TYPE public.rate_type AS ENUM ('flat', 'split', 'variable_rate', 'zone_based', 'see_and_spray');
CREATE TYPE public.product_form AS ENUM ('dry', 'liquid', 'gas', 'granular', 'other');
CREATE TYPE public.contract_type AS ENUM ('work_authorization', 'payment_agreement');
CREATE TYPE public.contract_status AS ENUM ('draft', 'pending_signature', 'partially_signed', 'fully_signed', 'expired', 'voided');
CREATE TYPE public.signature_status AS ENUM ('pending', 'signed', 'declined', 'expired');
CREATE TYPE public.comm_method AS ENUM ('in_app', 'email', 'sms', 'phone');

-- Operation specifications (per-job structured specs)
CREATE TABLE public.operation_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  operation_type public.operation_type NOT NULL,
  spec_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id)
);
ALTER TABLE public.operation_specs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Op specs select" ON public.operation_specs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM jobs j WHERE j.id = operation_specs.job_id AND (j.requested_by = auth.uid() OR j.operator_id = auth.uid())) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Op specs manage" ON public.operation_specs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM jobs j WHERE j.id = operation_specs.job_id AND (j.requested_by = auth.uid())) OR has_role(auth.uid(), 'admin'));

-- Locations (farm HQ, operator yards, access points)
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'headquarters',
  label TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  lat NUMERIC,
  lng NUMERIC,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Locations select" ON public.locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Locations manage" ON public.locations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.organization_id = locations.organization_id AND p.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'));

-- Communication preferences
CREATE TABLE public.communication_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_method public.comm_method NOT NULL DEFAULT 'in_app',
  alternate_phone TEXT,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  notify_quotes BOOLEAN DEFAULT true,
  notify_scheduling BOOLEAN DEFAULT true,
  notify_delays BOOLEAN DEFAULT true,
  notify_packets BOOLEAN DEFAULT true,
  notify_approvals BOOLEAN DEFAULT true,
  notify_invoices BOOLEAN DEFAULT true,
  notify_payouts BOOLEAN DEFAULT true,
  notify_contracts BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
ALTER TABLE public.communication_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comm prefs own" ON public.communication_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Service areas (operator coverage)
CREATE TABLE public.service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_profile_id UUID NOT NULL REFERENCES public.operator_profiles(id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  county TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service areas select" ON public.service_areas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service areas manage" ON public.service_areas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM operator_profiles op WHERE op.id = service_areas.operator_profile_id AND op.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'));

-- Contracts
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  type public.contract_type NOT NULL,
  status public.contract_status NOT NULL DEFAULT 'draft',
  title TEXT NOT NULL,
  content_html TEXT,
  content_json JSONB DEFAULT '{}'::jsonb,
  fields_included UUID[] DEFAULT '{}'::uuid[],
  terms JSONB DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  fully_signed_at TIMESTAMPTZ
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Contracts select" ON public.contracts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM jobs j WHERE j.id = contracts.job_id AND (j.requested_by = auth.uid() OR j.operator_id = auth.uid())) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Contracts manage" ON public.contracts FOR ALL TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Contract signatures
CREATE TABLE public.contract_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  signer_id UUID NOT NULL,
  signer_name TEXT NOT NULL,
  signer_role TEXT NOT NULL,
  status public.signature_status NOT NULL DEFAULT 'pending',
  signed_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signatures select" ON public.contract_signatures FOR SELECT TO authenticated
  USING (signer_id = auth.uid() OR EXISTS (SELECT 1 FROM contracts c JOIN jobs j ON j.id = c.job_id WHERE c.id = contract_signatures.contract_id AND (j.requested_by = auth.uid() OR j.operator_id = auth.uid())) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Signatures manage" ON public.contract_signatures FOR ALL TO authenticated
  USING (signer_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Add onboarding_completed flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_comm_method public.comm_method DEFAULT 'in_app';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS billing_contact_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS billing_contact_email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approval_contact_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approval_contact_email TEXT;

-- Add crew_count and machine_compatibility to operator_profiles
ALTER TABLE public.operator_profiles ADD COLUMN IF NOT EXISTS crew_count INTEGER DEFAULT 1;
ALTER TABLE public.operator_profiles ADD COLUMN IF NOT EXISTS machine_compatibility TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.operator_profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE public.operator_profiles ADD COLUMN IF NOT EXISTS contract_signer_name TEXT;
ALTER TABLE public.operator_profiles ADD COLUMN IF NOT EXISTS contract_signer_email TEXT;

-- Triggers for updated_at
CREATE TRIGGER set_operation_specs_updated_at BEFORE UPDATE ON public.operation_specs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_communication_preferences_updated_at BEFORE UPDATE ON public.communication_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
