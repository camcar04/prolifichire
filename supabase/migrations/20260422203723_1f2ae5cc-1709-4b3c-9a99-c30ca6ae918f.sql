-- Enable extensions for scheduled expiry sweep
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Link contracts that were created together (work_auth + payment_agreement from same quote)
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS contract_group_id uuid;

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS contract_group_id uuid,
  ADD COLUMN IF NOT EXISTS contracts_created_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_contracts_group ON public.contracts(contract_group_id) WHERE contract_group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_expires ON public.contracts(expires_at) WHERE status IN ('pending_signature','partially_signed');

-- ===========================================================
-- Cross-user notification helper (validates participation)
-- ===========================================================
CREATE OR REPLACE FUNCTION public.notify_contract_party(
  _contract_id uuid,
  _recipient_id uuid,
  _title text,
  _message text,
  _action_url text DEFAULT NULL,
  _type text DEFAULT 'action'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _job_id uuid;
  _is_participant boolean;
  _notif_id uuid;
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Find the job for this contract and verify caller is grower OR operator on it
  SELECT j.id INTO _job_id
  FROM contracts c
  JOIN jobs j ON j.id = c.job_id
  WHERE c.id = _contract_id;

  IF _job_id IS NULL THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM jobs
    WHERE id = _job_id
      AND (requested_by = _caller OR operator_id = _caller)
  ) INTO _is_participant;

  IF NOT _is_participant THEN
    RAISE EXCEPTION 'Not authorized to notify on this contract';
  END IF;

  -- Recipient must also be a participant on the job
  SELECT EXISTS (
    SELECT 1 FROM jobs
    WHERE id = _job_id
      AND (requested_by = _recipient_id OR operator_id = _recipient_id)
  ) INTO _is_participant;

  IF NOT _is_participant THEN
    RAISE EXCEPTION 'Recipient is not a participant on this job';
  END IF;

  INSERT INTO notifications (user_id, type, title, message, action_url, read)
  VALUES (_recipient_id, _type, _title, _message, _action_url, false)
  RETURNING id INTO _notif_id;

  RETURN _notif_id;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_contract_party(uuid,uuid,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notify_contract_party(uuid,uuid,text,text,text,text) TO authenticated;

-- ===========================================================
-- Trigger: when ALL contracts in a group are fully_signed,
-- flip job to funding_required automatically
-- ===========================================================
CREATE OR REPLACE FUNCTION public.maybe_unlock_funding()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _group_id uuid := NEW.contract_group_id;
  _job_id uuid := NEW.job_id;
  _total int;
  _signed int;
  _agreed numeric;
  _fee numeric;
BEGIN
  IF NEW.status <> 'fully_signed' OR _group_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT count(*),
         count(*) FILTER (WHERE status = 'fully_signed')
    INTO _total, _signed
    FROM contracts
   WHERE contract_group_id = _group_id;

  IF _total > 0 AND _total = _signed THEN
    -- Pull agreed price from the linked quote
    SELECT total_quote INTO _agreed
      FROM quotes
     WHERE contract_group_id = _group_id
     LIMIT 1;

    IF _agreed IS NOT NULL THEN
      _fee := round(_agreed * 0.075 * 100) / 100;
      UPDATE jobs
         SET agreed_price = _agreed,
             platform_fee_amount = _fee,
             funding_status = 'funding_required'
       WHERE id = _job_id
         AND funding_status IN ('unfunded', 'funding_required');
    ELSE
      UPDATE jobs
         SET funding_status = 'funding_required'
       WHERE id = _job_id
         AND funding_status = 'unfunded';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_unlock_funding ON public.contracts;
CREATE TRIGGER trg_unlock_funding
AFTER UPDATE OF status ON public.contracts
FOR EACH ROW
WHEN (NEW.status = 'fully_signed' AND OLD.status IS DISTINCT FROM 'fully_signed')
EXECUTE FUNCTION public.maybe_unlock_funding();

-- ===========================================================
-- Expiry sweep: marks unsigned contracts expired and cancels the quote
-- ===========================================================
CREATE OR REPLACE FUNCTION public.expire_unsigned_contracts()
RETURNS TABLE(expired_contracts int, cancelled_quotes int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _expired_count int := 0;
  _cancelled_count int := 0;
  _group_ids uuid[];
BEGIN
  -- Find expired contracts that haven't been finalized
  WITH expired AS (
    UPDATE contracts
       SET status = 'expired'
     WHERE status IN ('pending_signature', 'partially_signed', 'draft')
       AND expires_at IS NOT NULL
       AND expires_at < now()
     RETURNING id, contract_group_id
  )
  SELECT count(*), array_agg(DISTINCT contract_group_id) FILTER (WHERE contract_group_id IS NOT NULL)
    INTO _expired_count, _group_ids
    FROM expired;

  -- Mark linked quotes as expired (so the grower has to start over)
  IF _group_ids IS NOT NULL AND array_length(_group_ids, 1) > 0 THEN
    UPDATE quotes
       SET status = 'expired'
     WHERE contract_group_id = ANY(_group_ids)
       AND status NOT IN ('expired','rejected','accepted');
    GET DIAGNOSTICS _cancelled_count = ROW_COUNT;

    -- Mark associated pending signatures as expired too
    UPDATE contract_signatures
       SET status = 'expired'
     WHERE status = 'pending'
       AND contract_id IN (SELECT id FROM contracts WHERE contract_group_id = ANY(_group_ids));
  END IF;

  RETURN QUERY SELECT _expired_count, _cancelled_count;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_unsigned_contracts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_unsigned_contracts() TO authenticated, service_role;

-- Schedule hourly sweep (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-unsigned-contracts-hourly') THEN
    PERFORM cron.schedule(
      'expire-unsigned-contracts-hourly',
      '0 * * * *',
      $cron$ SELECT public.expire_unsigned_contracts(); $cron$
    );
  END IF;
END $$;