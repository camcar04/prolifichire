-- 1) Suspended timestamp on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz;

-- 2) Support tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  assigned_to uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tickets insert own" ON public.support_tickets;
CREATE POLICY "Tickets insert own"
ON public.support_tickets FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Tickets select own or admin" ON public.support_tickets;
CREATE POLICY "Tickets select own or admin"
ON public.support_tickets FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::user_role));

DROP POLICY IF EXISTS "Tickets update admin" ON public.support_tickets;
CREATE POLICY "Tickets update admin"
ON public.support_tickets FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);

-- 3) Platform settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value text,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Settings select all auth" ON public.platform_settings;
CREATE POLICY "Settings select all auth"
ON public.platform_settings FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Settings manage admin" ON public.platform_settings;
CREATE POLICY "Settings manage admin"
ON public.platform_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed defaults (idempotent)
INSERT INTO public.platform_settings (key, value, description) VALUES
  ('platform_fee_percent', '0.075', 'Platform fee percentage per side (7.5%)'),
  ('grower_fee_percent', '0.075', 'Fee charged to grower on top of job total'),
  ('operator_fee_percent', '0.075', 'Fee deducted from operator payout'),
  ('support_email', 'support@prolifichire.com', 'Support contact email'),
  ('maintenance_mode', 'false', 'Set to true to show maintenance banner')
ON CONFLICT (key) DO NOTHING;