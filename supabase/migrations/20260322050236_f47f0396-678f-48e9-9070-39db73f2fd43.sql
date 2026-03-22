
-- Organization members table
CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  org_role text NOT NULL DEFAULT 'member',
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  invited_by uuid,
  UNIQUE(organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Organization invites table
CREATE TABLE public.organization_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  org_role text NOT NULL DEFAULT 'member',
  invited_by uuid NOT NULL,
  accepted_at timestamp with time zone,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

-- Security definer functions
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id AND org_role IN ('owner', 'admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id
  )
$$;

-- RLS policies
CREATE POLICY "Org members select" ON public.organization_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_org_member(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Org members manage" ON public.organization_members FOR ALL TO authenticated
  USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Org invites select" ON public.organization_invites FOR SELECT TO authenticated
  USING (invited_by = auth.uid() OR is_org_member(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Org invites insert" ON public.organization_invites FOR INSERT TO authenticated
  WITH CHECK (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Org invites update" ON public.organization_invites FOR UPDATE TO authenticated
  USING (invited_by = auth.uid() OR is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::user_role));
