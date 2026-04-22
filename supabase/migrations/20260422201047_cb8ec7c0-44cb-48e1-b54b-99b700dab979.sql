-- Profiles marketing attribution + primary location
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS referral_source text,
  ADD COLUMN IF NOT EXISTS signup_date timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS county text;

-- Page views
CREATE TABLE IF NOT EXISTS public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  path text NOT NULL,
  referrer text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Page views insert own" ON public.page_views;
CREATE POLICY "Page views insert own"
ON public.page_views FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Page views select admin" ON public.page_views;
CREATE POLICY "Page views select admin"
ON public.page_views FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::user_role));

CREATE INDEX IF NOT EXISTS idx_page_views_user ON public.page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON public.page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON public.page_views(path);

-- User events
CREATE TABLE IF NOT EXISTS public.user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User events insert own" ON public.user_events;
CREATE POLICY "User events insert own"
ON public.user_events FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "User events select admin" ON public.user_events;
CREATE POLICY "User events select admin"
ON public.user_events FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::user_role));

CREATE INDEX IF NOT EXISTS idx_user_events_user ON public.user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_type ON public.user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_created ON public.user_events(created_at DESC);