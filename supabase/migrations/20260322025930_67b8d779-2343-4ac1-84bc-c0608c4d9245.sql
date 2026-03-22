
-- ═══════════════════════════════════════════════════════
-- ProlificHire Database Schema
-- ═══════════════════════════════════════════════════════

-- Enums
CREATE TYPE public.user_role AS ENUM ('grower', 'operator', 'farm_manager', 'admin', 'finance');
CREATE TYPE public.operation_type AS ENUM ('spraying', 'planting', 'harvest', 'tillage', 'hauling', 'scouting', 'soil_sampling', 'fertilizing', 'seeding', 'mowing', 'drainage', 'other');
CREATE TYPE public.job_status AS ENUM ('draft', 'requested', 'quoted', 'accepted', 'scheduled', 'in_progress', 'delayed', 'completed', 'approved', 'invoiced', 'paid', 'closed', 'cancelled', 'disputed');
CREATE TYPE public.pricing_model AS ENUM ('per_acre', 'per_hour', 'flat_rate', 'negotiated');
CREATE TYPE public.crop_type AS ENUM ('corn', 'soybeans', 'wheat', 'alfalfa', 'oats', 'sorghum', 'sunflower', 'canola', 'cotton', 'rice', 'barley', 'cover_crop', 'other');
CREATE TYPE public.file_category AS ENUM ('boundary', 'prescription', 'planting', 'as_applied', 'harvest', 'soil_sample', 'photo', 'access_instructions', 'operator_notes', 'completion_photo', 'machine_data', 'invoice_doc', 'insurance', 'certification', 'other');
CREATE TYPE public.file_format AS ENUM ('geojson', 'shapefile', 'kml', 'csv', 'pdf', 'png', 'jpg', 'zip', 'isoxml', 'other');
CREATE TYPE public.packet_status AS ENUM ('pending', 'generating', 'ready', 'downloaded', 'expired', 'regenerating');
CREATE TYPE public.payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE public.dispute_status AS ENUM ('opened', 'under_review', 'resolved', 'escalated', 'closed');
CREATE TYPE public.exception_type AS ENUM ('weather_delay', 'partial_completion', 'no_show', 'field_inaccessible', 'missing_data', 'scope_change', 'pricing_change', 'equipment_failure', 'dispute');
CREATE TYPE public.credential_type AS ENUM ('insurance', 'license', 'certification', 'registration', 'bond');
CREATE TYPE public.permission_level AS ENUM ('view', 'order_work', 'upload_files', 'approve_payment', 'manage', 'admin');
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'viewed', 'paid', 'overdue', 'voided');
CREATE TYPE public.field_status AS ENUM ('idle', 'active', 'pending', 'restricted');
CREATE TYPE public.quote_status AS ENUM ('pending', 'accepted', 'declined', 'expired', 'countered');

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- Organizations
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('farm', 'operator', 'management', 'admin')),
  address TEXT, city TEXT, state TEXT, zip TEXT, phone TEXT, website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  phone TEXT, avatar_url TEXT,
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- Farms
CREATE TABLE public.farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  tenant_id UUID REFERENCES auth.users(id),
  county TEXT, state TEXT,
  total_acres NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fields
CREATE TABLE public.fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  legal_description TEXT, county TEXT, state TEXT,
  crop crop_type NOT NULL DEFAULT 'other',
  crop_year INT NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  acreage NUMERIC(10,2) NOT NULL DEFAULT 0,
  centroid_lat NUMERIC(10,6), centroid_lng NUMERIC(10,6),
  bbox_north NUMERIC(10,6), bbox_south NUMERIC(10,6), bbox_east NUMERIC(10,6), bbox_west NUMERIC(10,6),
  boundary_geojson JSONB,
  status field_status NOT NULL DEFAULT 'idle',
  clu_number TEXT, fsa_farm_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fields_farm ON public.fields(farm_id);

-- Field Requirements
CREATE TABLE public.field_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  type TEXT NOT NULL, description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  applies_to operation_type[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Field Access Instructions
CREATE TABLE public.field_access_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL UNIQUE REFERENCES public.fields(id) ON DELETE CASCADE,
  directions TEXT NOT NULL, gate_code TEXT, contact_name TEXT, contact_phone TEXT,
  hazards TEXT, notes TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Operator Profiles
CREATE TABLE public.operator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  business_name TEXT NOT NULL,
  service_types operation_type[] NOT NULL DEFAULT '{}',
  service_radius INT DEFAULT 50,
  base_lat NUMERIC(10,6), base_lng NUMERIC(10,6), base_address TEXT,
  years_experience INT DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0, review_count INT DEFAULT 0, completed_jobs INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT false, insurance_verified BOOLEAN DEFAULT false,
  bio TEXT,
  stripe_account_id TEXT, stripe_onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Equipment
CREATE TABLE public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES public.operator_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, make TEXT NOT NULL, model TEXT NOT NULL,
  year INT, width_ft NUMERIC(6,1), capacity TEXT,
  gps_equipped BOOLEAN DEFAULT false, iso_compatible BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Credentials
CREATE TABLE public.credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES public.operator_profiles(id) ON DELETE CASCADE,
  type credential_type NOT NULL,
  name TEXT NOT NULL, issuer TEXT NOT NULL, number TEXT,
  issued_at DATE, expires_at DATE, file_path TEXT,
  is_verified BOOLEAN DEFAULT false, verified_at TIMESTAMPTZ, verified_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('active', 'expiring_soon', 'expired', 'pending_verification')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Jobs
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id TEXT NOT NULL UNIQUE DEFAULT '',
  farm_id UUID NOT NULL REFERENCES public.farms(id),
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  operation_type operation_type NOT NULL,
  status job_status NOT NULL DEFAULT 'draft',
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent', 'critical')),
  title TEXT NOT NULL, description TEXT, notes TEXT, requirements TEXT,
  operator_id UUID REFERENCES auth.users(id),
  pricing_model pricing_model NOT NULL DEFAULT 'per_acre',
  base_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_acres NUMERIC(10,2) NOT NULL DEFAULT 0,
  estimated_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  approved_total NUMERIC(10,2), invoiced_total NUMERIC(10,2), paid_total NUMERIC(10,2),
  scheduled_start TIMESTAMPTZ, scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ, actual_end TIMESTAMPTZ,
  deadline TIMESTAMPTZ NOT NULL,
  travel_distance NUMERIC(6,1), travel_eta INT,
  split_payment BOOLEAN DEFAULT false,
  proof_submitted BOOLEAN DEFAULT false, proof_approved BOOLEAN DEFAULT false,
  change_order_count INT DEFAULT 0, exception_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_operator ON public.jobs(operator_id);

-- Job Fields
CREATE TABLE public.job_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.fields(id),
  acreage NUMERIC(10,2) NOT NULL, crop crop_type NOT NULL DEFAULT 'other',
  sequence INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  UNIQUE(job_id, field_id)
);

-- Quotes
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES auth.users(id),
  pricing_model pricing_model NOT NULL,
  base_rate NUMERIC(10,2) NOT NULL,
  travel_fee NUMERIC(10,2) DEFAULT 0, material_cost NUMERIC(10,2) DEFAULT 0,
  total_quote NUMERIC(10,2) NOT NULL,
  notes TEXT, valid_until TIMESTAMPTZ,
  status quote_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Split Rules
CREATE TABLE public.split_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL REFERENCES auth.users(id),
  payer_name TEXT NOT NULL,
  payer_role TEXT NOT NULL CHECK (payer_role IN ('owner', 'tenant', 'manager', 'other')),
  percentage NUMERIC(5,2) NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  fixed_amount NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid'))
);

-- Dataset Assets
CREATE TABLE public.dataset_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id),
  category file_category NOT NULL,
  format file_format NOT NULL DEFAULT 'other',
  file_name TEXT NOT NULL, file_size BIGINT NOT NULL DEFAULT 0, mime_type TEXT,
  storage_path TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1, crop_year INT,
  operation_type operation_type,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  description TEXT, is_latest BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_datasets_field ON public.dataset_assets(field_id);

-- Field Packets
CREATE TABLE public.field_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.fields(id),
  version INT NOT NULL DEFAULT 1,
  status packet_status NOT NULL DEFAULT 'pending',
  operator_id UUID REFERENCES auth.users(id),
  missing_required TEXT[] DEFAULT '{}',
  generated_at TIMESTAMPTZ, approved_for_execution BOOLEAN DEFAULT false, approved_at TIMESTAMPTZ,
  download_count INT DEFAULT 0, last_download_at TIMESTAMPTZ, last_download_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Field Packet Files
CREATE TABLE public.field_packet_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id UUID NOT NULL REFERENCES public.field_packets(id) ON DELETE CASCADE,
  dataset_id UUID REFERENCES public.dataset_assets(id),
  category file_category NOT NULL,
  file_name TEXT, file_size BIGINT DEFAULT 0,
  format file_format NOT NULL DEFAULT 'other',
  version INT DEFAULT 1, included BOOLEAN DEFAULT true, required BOOLEAN DEFAULT false
);

-- Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id TEXT NOT NULL UNIQUE DEFAULT '',
  job_id UUID NOT NULL REFERENCES public.jobs(id),
  field_id UUID NOT NULL REFERENCES public.fields(id),
  issued_to UUID NOT NULL REFERENCES auth.users(id),
  issued_by UUID NOT NULL REFERENCES auth.users(id),
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  fees NUMERIC(10,2) DEFAULT 0, tax NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status invoice_status NOT NULL DEFAULT 'draft',
  due_date DATE NOT NULL, paid_at TIMESTAMPTZ,
  stripe_invoice_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoice Line Items
CREATE TABLE public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL, quantity NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL, unit_price NUMERIC(10,2) NOT NULL, total NUMERIC(10,2) NOT NULL
);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id),
  payer_id UUID NOT NULL REFERENCES auth.users(id),
  amount NUMERIC(10,2) NOT NULL,
  method TEXT DEFAULT 'ach' CHECK (method IN ('ach', 'card', 'wire', 'check')),
  status payment_status NOT NULL DEFAULT 'pending',
  stripe_payment_id TEXT, processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payouts
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES auth.users(id),
  job_id UUID NOT NULL REFERENCES public.jobs(id),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id),
  gross_amount NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) DEFAULT 0, processing_fee NUMERIC(10,2) DEFAULT 0,
  net_amount NUMERIC(10,2) NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  stripe_transfer_id TEXT, estimated_arrival DATE, completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Disputes
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id TEXT NOT NULL UNIQUE DEFAULT '',
  job_id UUID NOT NULL REFERENCES public.jobs(id),
  field_id UUID NOT NULL REFERENCES public.fields(id),
  raised_by UUID NOT NULL REFERENCES auth.users(id),
  against_id UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL, description TEXT,
  amount_disputed NUMERIC(10,2) DEFAULT 0,
  status dispute_status NOT NULL DEFAULT 'opened',
  resolution TEXT, resolved_at TIMESTAMPTZ, resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Job Exceptions
CREATE TABLE public.job_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  type exception_type NOT NULL,
  description TEXT NOT NULL,
  raised_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'escalated')),
  resolution TEXT, resolved_by UUID REFERENCES auth.users(id), resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Message Threads
CREATE TABLE public.message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id),
  field_id UUID REFERENCES public.fields(id),
  subject TEXT NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  last_message_preview TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Thread Participants
CREATE TABLE public.thread_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  unread_count INT DEFAULT 0,
  UNIQUE(thread_id, user_id)
);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  attachment_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_thread ON public.messages(thread_id);

-- Audit Logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id), user_name TEXT,
  description TEXT NOT NULL, metadata JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_time ON public.audit_logs(created_at DESC);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'action', 'success', 'error')),
  title TEXT NOT NULL, message TEXT NOT NULL, action_url TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, read);

-- Permission Grants
CREATE TABLE public.permission_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('field', 'farm', 'organization')),
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  level permission_level NOT NULL,
  granted_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_permissions_entity ON public.permission_grants(entity_type, entity_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (NEW.id, COALESCE(NEW.email, ''), COALESCE(NEW.raw_user_meta_data->>'first_name', ''), COALESCE(NEW.raw_user_meta_data->>'last_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON public.farms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fields_updated_at BEFORE UPDATE ON public.fields FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_operator_profiles_updated_at BEFORE UPDATE ON public.operator_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_access_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_packet_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_grants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Roles viewable" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Orgs viewable" ON public.organizations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Orgs managed by admins" ON public.organizations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Farm access" ON public.farms FOR SELECT TO authenticated USING (owner_id = auth.uid() OR tenant_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Farm owner manages" ON public.farms FOR ALL TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Field select" ON public.fields FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_id AND (f.owner_id = auth.uid() OR f.tenant_id = auth.uid()))
  OR EXISTS (SELECT 1 FROM public.permission_grants pg WHERE pg.entity_type = 'field' AND pg.entity_id = id AND pg.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Field manage" ON public.fields FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_id AND f.owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Field requirements select" ON public.field_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Field requirements manage" ON public.field_requirements FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.fields fl JOIN public.farms f ON f.id = fl.farm_id WHERE fl.id = field_id AND f.owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Field access select" ON public.field_access_instructions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Field access manage" ON public.field_access_instructions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.fields fl JOIN public.farms f ON f.id = fl.farm_id WHERE fl.id = field_id AND f.owner_id = auth.uid()) OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Operator profiles viewable" ON public.operator_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Operator manages own" ON public.operator_profiles FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Equipment viewable" ON public.equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "Equipment managed" ON public.equipment FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.operator_profiles op WHERE op.id = operator_id AND op.user_id = auth.uid())
);

CREATE POLICY "Credentials viewable" ON public.credentials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Credentials managed" ON public.credentials FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.operator_profiles op WHERE op.id = operator_id AND op.user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Jobs select" ON public.jobs FOR SELECT TO authenticated USING (requested_by = auth.uid() OR operator_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Jobs insert" ON public.jobs FOR INSERT TO authenticated WITH CHECK (requested_by = auth.uid());
CREATE POLICY "Jobs update" ON public.jobs FOR UPDATE TO authenticated USING (requested_by = auth.uid() OR operator_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Job fields select" ON public.job_fields FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND (j.requested_by = auth.uid() OR j.operator_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Job fields manage" ON public.job_fields FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND (j.requested_by = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);

CREATE POLICY "Quotes select" ON public.quotes FOR SELECT TO authenticated USING (
  operator_id = auth.uid() OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.requested_by = auth.uid()) OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Quotes insert" ON public.quotes FOR INSERT TO authenticated WITH CHECK (operator_id = auth.uid());

CREATE POLICY "Split rules select" ON public.split_rules FOR SELECT TO authenticated USING (
  payer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND (j.requested_by = auth.uid() OR j.operator_id = auth.uid())) OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Split rules manage" ON public.split_rules FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.requested_by = auth.uid()) OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Datasets select" ON public.dataset_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Datasets insert" ON public.dataset_assets FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "Datasets update" ON public.dataset_assets FOR UPDATE TO authenticated USING (uploaded_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Packets select" ON public.field_packets FOR SELECT TO authenticated USING (
  operator_id = auth.uid() OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.requested_by = auth.uid()) OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Packets manage" ON public.field_packets FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.requested_by = auth.uid())
);

CREATE POLICY "Packet files select" ON public.field_packet_files FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.field_packets fp WHERE fp.id = packet_id AND (fp.operator_id = auth.uid() OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = fp.job_id AND j.requested_by = auth.uid()) OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Packet files manage" ON public.field_packet_files FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Invoices select" ON public.invoices FOR SELECT TO authenticated USING (issued_to = auth.uid() OR issued_by = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance'));
CREATE POLICY "Invoices insert" ON public.invoices FOR INSERT TO authenticated WITH CHECK (issued_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Line items select" ON public.invoice_line_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND (i.issued_to = auth.uid() OR i.issued_by = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Line items manage" ON public.invoice_line_items FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND (i.issued_by = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);

CREATE POLICY "Payments select" ON public.payments FOR SELECT TO authenticated USING (payer_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance'));
CREATE POLICY "Payments insert" ON public.payments FOR INSERT TO authenticated WITH CHECK (payer_id = auth.uid());

CREATE POLICY "Payouts select" ON public.payouts FOR SELECT TO authenticated USING (operator_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance'));

CREATE POLICY "Disputes select" ON public.disputes FOR SELECT TO authenticated USING (raised_by = auth.uid() OR against_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Disputes insert" ON public.disputes FOR INSERT TO authenticated WITH CHECK (raised_by = auth.uid());

CREATE POLICY "Exceptions select" ON public.job_exceptions FOR SELECT TO authenticated USING (
  raised_by = auth.uid() OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND (j.requested_by = auth.uid() OR j.operator_id = auth.uid())) OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Exceptions insert" ON public.job_exceptions FOR INSERT TO authenticated WITH CHECK (raised_by = auth.uid());

CREATE POLICY "Threads select" ON public.message_threads FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.thread_participants tp WHERE tp.thread_id = id AND tp.user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Threads insert" ON public.message_threads FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Participants select" ON public.thread_participants FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Participants insert" ON public.thread_participants FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Messages select" ON public.messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.thread_participants tp WHERE tp.thread_id = thread_id AND tp.user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Messages insert" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Audit select" ON public.audit_logs FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Audit insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Notifications select" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Notifications update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Notifications insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permissions select" ON public.permission_grants FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR granted_by = auth.uid() OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Permissions manage" ON public.permission_grants FOR ALL TO authenticated USING (granted_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('field-data', 'field-data', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('field-photos', 'field-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('credentials', 'credentials', false);

CREATE POLICY "Auth read field-data" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'field-data');
CREATE POLICY "Auth upload field-data" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'field-data');
CREATE POLICY "Public read field-photos" ON storage.objects FOR SELECT USING (bucket_id = 'field-photos');
CREATE POLICY "Auth upload field-photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'field-photos');
CREATE POLICY "Auth read documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "Auth upload documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Auth read credentials" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'credentials');
CREATE POLICY "Auth upload credentials" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'credentials');

-- Display ID sequences
CREATE SEQUENCE IF NOT EXISTS public.job_display_id_seq START WITH 1848;
CREATE OR REPLACE FUNCTION public.generate_job_display_id() RETURNS TRIGGER AS $$
BEGIN IF NEW.display_id IS NULL OR NEW.display_id = '' THEN NEW.display_id := 'JOB-' || nextval('public.job_display_id_seq'); END IF; RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER set_job_display_id BEFORE INSERT ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.generate_job_display_id();

CREATE SEQUENCE IF NOT EXISTS public.invoice_display_id_seq START WITH 3022;
CREATE OR REPLACE FUNCTION public.generate_invoice_display_id() RETURNS TRIGGER AS $$
BEGIN IF NEW.display_id IS NULL OR NEW.display_id = '' THEN NEW.display_id := 'INV-' || nextval('public.invoice_display_id_seq'); END IF; RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER set_invoice_display_id BEFORE INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.generate_invoice_display_id();

CREATE SEQUENCE IF NOT EXISTS public.dispute_display_id_seq START WITH 1002;
CREATE OR REPLACE FUNCTION public.generate_dispute_display_id() RETURNS TRIGGER AS $$
BEGIN IF NEW.display_id IS NULL OR NEW.display_id = '' THEN NEW.display_id := 'DSP-' || nextval('public.dispute_display_id_seq'); END IF; RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER set_dispute_display_id BEFORE INSERT ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.generate_dispute_display_id();
