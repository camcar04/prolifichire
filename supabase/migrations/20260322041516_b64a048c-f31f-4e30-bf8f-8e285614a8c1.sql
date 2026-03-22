-- Add baling to operation_type enum
ALTER TYPE public.operation_type ADD VALUE IF NOT EXISTS 'baling' AFTER 'mowing';

-- Create a function to check if a user is the platform admin by email
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.user_roles ur ON ur.user_id = u.id
    WHERE u.id = _user_id
      AND u.email = 'carstenscamden1@gmail.com'
      AND ur.role = 'admin'
  )
$$;

-- Add trigger to prevent non-authorized admin role assignments
CREATE OR REPLACE FUNCTION public.enforce_admin_restriction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    -- Only allow admin role for the specific email
    IF NOT EXISTS (
      SELECT 1 FROM auth.users WHERE id = NEW.user_id AND email = 'carstenscamden1@gmail.com'
    ) THEN
      RAISE EXCEPTION 'Admin role can only be assigned to authorized accounts';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_admin_role_restriction
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_admin_restriction();