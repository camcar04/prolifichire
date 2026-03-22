
-- Operator capabilities table for detailed service matching
CREATE TABLE public.operator_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_profile_id uuid NOT NULL REFERENCES public.operator_profiles(id) ON DELETE CASCADE,
  sub_capabilities text[] NOT NULL DEFAULT '{}',
  supported_crops text[] NOT NULL DEFAULT '{}',
  equipment_capabilities text[] NOT NULL DEFAULT '{}',
  min_job_acres numeric DEFAULT 0,
  max_job_acres numeric DEFAULT NULL,
  preferred_job_types text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(operator_profile_id)
);

ALTER TABLE public.operator_capabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Capabilities own" ON public.operator_capabilities FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM operator_profiles op WHERE op.id = operator_capabilities.operator_profile_id AND op.user_id = auth.uid()));

CREATE POLICY "Capabilities viewable" ON public.operator_capabilities FOR SELECT TO authenticated
  USING (true);

-- Alert rules: user-defined conditions for when to fire alerts
CREATE TABLE public.alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rule_type text NOT NULL DEFAULT 'job_match',
  conditions jsonb NOT NULL DEFAULT '{}',
  channels text[] NOT NULL DEFAULT '{in_app}',
  frequency text NOT NULL DEFAULT 'instant',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alert rules own" ON public.alert_rules FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Enable realtime on notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
