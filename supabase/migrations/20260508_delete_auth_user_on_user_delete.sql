-- Keep auth and profile records in sync:
-- deleting public.users should also delete the corresponding auth.users row.

CREATE OR REPLACE FUNCTION public.delete_auth_user_on_user_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  DELETE FROM auth.users
  WHERE id = OLD.id;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_delete_auth_user_on_user_delete ON public.users;

CREATE TRIGGER trg_delete_auth_user_on_user_delete
AFTER DELETE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.delete_auth_user_on_user_delete();
