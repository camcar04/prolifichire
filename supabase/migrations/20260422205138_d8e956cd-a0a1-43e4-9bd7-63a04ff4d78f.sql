
-- ─────────────────────────────────────────────────────────────
-- Tiered platform-fee schedule + auto-invoice on job approval
-- ─────────────────────────────────────────────────────────────

-- Resolves the platform fee rate for a given operation type.
-- Mirrors OPERATION_FEE_SCHEDULE in supabase/functions/stripe-checkout/index.ts.
CREATE OR REPLACE FUNCTION public.platform_fee_rate_for(_operation_type text)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN CASE lower(coalesce(_operation_type, 'other'))
    WHEN 'spraying'      THEN 0.12
    WHEN 'fertilizing'   THEN 0.12
    WHEN 'planting'      THEN 0.10
    WHEN 'seeding'       THEN 0.10
    WHEN 'harvest'       THEN 0.10
    WHEN 'tillage'       THEN 0.08
    WHEN 'hauling'       THEN 0.08
    WHEN 'grain_hauling' THEN 0.08
    WHEN 'scouting'      THEN 0.15
    WHEN 'soil_sampling' THEN 0.15
    WHEN 'drainage'      THEN 0.10
    WHEN 'mowing'        THEN 0.10
    WHEN 'baling'        THEN 0.10
    WHEN 'rock_picking'  THEN 0.08
    ELSE 0.10
  END;
END;
$$;

-- Auto-create an invoice (draft → sent) when a job becomes 'approved'.
-- - Subtotal = approved_total (or agreed_price)
-- - Fees     = subtotal * tiered rate (operation_type)
-- - Total    = subtotal (operator_payout = subtotal - fees, deducted via line item)
-- Idempotent: skips if an invoice already exists for the job.
CREATE OR REPLACE FUNCTION public.auto_create_invoice_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existing_id uuid;
  _invoice_id uuid;
  _subtotal numeric;
  _fee_rate numeric;
  _fee numeric;
  _operator_payout numeric;
  _actual_acres numeric;
  _line_label text;
  _farm_id uuid;
  _field_id uuid;
BEGIN
  -- Only fire on transition into 'approved'
  IF NEW.status::text <> 'approved' THEN RETURN NEW; END IF;
  IF OLD.status::text = 'approved' THEN RETURN NEW; END IF;
  IF NEW.operator_id IS NULL OR NEW.requested_by IS NULL THEN RETURN NEW; END IF;

  -- Skip if invoice already exists for this job
  SELECT id INTO _existing_id FROM public.invoices WHERE job_id = NEW.id LIMIT 1;
  IF _existing_id IS NOT NULL THEN RETURN NEW; END IF;

  -- Resolve subtotal
  _subtotal := COALESCE(NEW.approved_total, NEW.agreed_price, NEW.estimated_total, 0);
  IF _subtotal <= 0 THEN RETURN NEW; END IF;

  -- Resolve tiered fee rate (prefer the rate already locked at funding time)
  _fee_rate := COALESCE(
    NULLIF(NEW.platform_fee_rate, 0),
    public.platform_fee_rate_for(NEW.operation_type::text)
  );
  _fee := round(_subtotal * _fee_rate, 2);
  _operator_payout := round(_subtotal - _fee, 2);

  -- Pull the latest actual_acres (if proof was submitted)
  SELECT actual_acres INTO _actual_acres
    FROM public.proof_of_work
   WHERE job_id = NEW.id
   ORDER BY version DESC NULLS LAST, created_at DESC
   LIMIT 1;
  _actual_acres := COALESCE(_actual_acres, NEW.total_acres, 0);

  -- Best-effort field link (some jobs are multi-field)
  SELECT field_id INTO _field_id FROM public.job_fields WHERE job_id = NEW.id ORDER BY sequence LIMIT 1;
  _farm_id := NEW.farm_id;
  IF _field_id IS NULL THEN _field_id := _farm_id; END IF;

  -- Build line label
  _line_label := initcap(replace(NEW.operation_type::text, '_', ' '))
                 || ' service'
                 || CASE WHEN _actual_acres > 0
                         THEN ' - ' || trim(to_char(_actual_acres, 'FM999990.0')) || ' acres'
                         ELSE '' END;

  -- Create the invoice
  INSERT INTO public.invoices (
    job_id, field_id, issued_by, issued_to,
    subtotal, fees, tax, total,
    due_date, status
  ) VALUES (
    NEW.id, _field_id, NEW.operator_id, NEW.requested_by,
    _subtotal, _fee, 0, _subtotal,
    (now()::date), 'sent'
  )
  RETURNING id INTO _invoice_id;

  -- Service line item
  INSERT INTO public.invoice_line_items (invoice_id, description, quantity, unit, unit_price, total)
  VALUES (_invoice_id, _line_label, 1, 'job', _subtotal, _subtotal);

  -- Platform fee line item (negative total)
  INSERT INTO public.invoice_line_items (invoice_id, description, quantity, unit, unit_price, total)
  VALUES (
    _invoice_id,
    'Platform fee (' || trim(to_char(_fee_rate * 100, 'FM990.0')) || '%)',
    1, 'fee', _fee, -_fee
  );

  -- Notify operator that the invoice is ready
  INSERT INTO public.notifications (user_id, type, title, message, action_url, read)
  VALUES (
    NEW.operator_id,
    'info',
    'Invoice ready',
    'Work approved. Invoice issued for $' || trim(to_char(_subtotal, 'FM999990.00'))
      || ' (payout $' || trim(to_char(_operator_payout, 'FM999990.00')) || ').',
    '/jobs/' || NEW.id,
    false
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_create_invoice_on_approval ON public.jobs;
CREATE TRIGGER trg_auto_create_invoice_on_approval
AFTER UPDATE OF status ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_invoice_on_approval();

-- Operator notification when payout is released
CREATE OR REPLACE FUNCTION public.notify_payout_released()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _farm_name text;
  _payout numeric;
BEGIN
  IF NEW.status::text <> 'paid' THEN RETURN NEW; END IF;
  IF OLD.status::text = 'paid' THEN RETURN NEW; END IF;
  IF NEW.operator_id IS NULL THEN RETURN NEW; END IF;

  SELECT name INTO _farm_name FROM public.farms WHERE id = NEW.farm_id;
  _payout := COALESCE(NEW.paid_total, 0);

  INSERT INTO public.notifications (user_id, type, title, message, action_url, read)
  VALUES (
    NEW.operator_id,
    'success',
    'Payout received',
    'You received a payout of $' || trim(to_char(_payout, 'FM999990.00'))
      || ' from ' || COALESCE(_farm_name, 'the grower') || '.',
    '/payouts',
    false
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_payout_released ON public.jobs;
CREATE TRIGGER trg_notify_payout_released
AFTER UPDATE OF status ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.notify_payout_released();
