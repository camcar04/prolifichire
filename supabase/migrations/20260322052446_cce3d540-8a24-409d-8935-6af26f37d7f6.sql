
CREATE TYPE public.network_type AS ENUM ('retailer', 'coop', 'ethanol_plant', 'grain_handler', 'other');
CREATE TYPE public.network_member_status AS ENUM ('invited', 'active', 'suspended', 'removed');
CREATE TYPE public.network_visibility AS ENUM ('private', 'hybrid', 'public');

CREATE TABLE public.networks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  network_type network_type NOT NULL DEFAULT 'other',
  description text,
  visibility network_visibility NOT NULL DEFAULT 'private',
  max_members integer DEFAULT 50,
  require_operator_approval boolean DEFAULT true,
  require_grower_approval boolean DEFAULT true,
  allowed_operation_types text[] DEFAULT '{}',
  required_credentials text[] DEFAULT '{}',
  pricing_visible boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.network_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id uuid NOT NULL REFERENCES public.networks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  member_type text NOT NULL DEFAULT 'grower',
  status network_member_status NOT NULL DEFAULT 'invited',
  invited_by uuid,
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(network_id, user_id)
);

CREATE TABLE public.network_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id uuid NOT NULL REFERENCES public.networks(id) ON DELETE CASCADE,
  rule_type text NOT NULL,
  rule_data jsonb NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Networks viewable" ON public.networks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Networks manage" ON public.networks FOR ALL TO authenticated USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Network members select" ON public.network_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.networks n WHERE n.id = network_members.network_id AND is_org_admin(auth.uid(), n.organization_id)) OR has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Network members manage" ON public.network_members FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.networks n WHERE n.id = network_members.network_id AND is_org_admin(auth.uid(), n.organization_id)) OR has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Network rules select" ON public.network_rules FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.network_members nm WHERE nm.network_id = network_rules.network_id AND nm.user_id = auth.uid() AND nm.status = 'active') OR has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Network rules manage" ON public.network_rules FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.networks n WHERE n.id = network_rules.network_id AND is_org_admin(auth.uid(), n.organization_id)) OR has_role(auth.uid(), 'admin'::user_role));

CREATE TRIGGER update_networks_updated_at BEFORE UPDATE ON public.networks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
