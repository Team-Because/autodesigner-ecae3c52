
-- 1. Harden user_roles INSERT/UPDATE/DELETE to use the has_role security-definer function
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;

CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Lock down SECURITY DEFINER functions that should never be callable
--    from the public Data API by anon or authenticated clients.
REVOKE EXECUTE ON FUNCTION public.deduct_credit(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
-- has_role and merge_brand stay callable by authenticated (used in RLS / RPC).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.merge_brand(uuid, uuid) FROM anon;

-- 3. Public storage bucket: restrict listing. Allow reading individual files
--    by exact name, but do not let clients enumerate the entire bucket.
DROP POLICY IF EXISTS "Public read brand-assets" ON storage.objects;
DROP POLICY IF EXISTS "Public can read brand-assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view brand-assets" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
