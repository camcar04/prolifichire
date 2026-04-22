CREATE OR REPLACE FUNCTION public.set_latest_asset()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.dataset_assets
  SET is_latest = false
  WHERE field_id = NEW.field_id
    AND category = NEW.category
    AND id != NEW.id
    AND is_latest = true;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_latest_asset ON public.dataset_assets;

CREATE TRIGGER trg_set_latest_asset
AFTER INSERT ON public.dataset_assets
FOR EACH ROW
WHEN (NEW.is_latest = true)
EXECUTE FUNCTION public.set_latest_asset();