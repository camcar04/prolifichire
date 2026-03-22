
-- External connections for OEM integrations
CREATE TABLE public.external_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL, -- 'john_deere', 'climate_fieldview', 'cnhi'
  provider_account_id text,
  display_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'disconnected', -- 'connected', 'disconnected', 'error', 'syncing'
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scopes text[] DEFAULT '{}',
  last_sync_at timestamptz,
  sync_status text DEFAULT 'idle', -- 'idle', 'syncing', 'success', 'error'
  sync_error text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.external_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "External connections own" ON public.external_connections
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Sync logs for OEM integrations
CREATE TABLE public.sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES public.external_connections(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  direction text NOT NULL DEFAULT 'import', -- 'import', 'export'
  entity_type text NOT NULL, -- 'field_boundary', 'planting_data', 'harvest_data', etc.
  entity_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'success', 'error', 'partial'
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sync logs own" ON public.sync_logs
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_external_connections_updated_at
  BEFORE UPDATE ON public.external_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
