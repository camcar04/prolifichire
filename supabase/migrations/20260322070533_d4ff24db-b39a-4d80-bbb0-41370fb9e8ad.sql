
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS primary_account_type text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS enabled_account_types text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS onboarding_progress jsonb DEFAULT '{}'::jsonb;
