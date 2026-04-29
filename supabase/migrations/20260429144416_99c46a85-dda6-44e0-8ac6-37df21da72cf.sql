CREATE POLICY "Admins can insert brand_assets for any user"
ON public.brand_assets
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));