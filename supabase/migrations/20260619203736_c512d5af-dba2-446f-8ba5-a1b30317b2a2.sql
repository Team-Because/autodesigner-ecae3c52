-- 1. Lock down deduct_credit RPC
REVOKE ALL ON FUNCTION public.deduct_credit(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.deduct_credit(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.deduct_credit(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_credit(uuid) TO service_role;

-- 2. Atomic credit consumption (eliminates race condition)
CREATE OR REPLACE FUNCTION public.try_consume_credit(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _updated integer;
BEGIN
  UPDATE public.user_credits
  SET credits_remaining = credits_remaining - 1,
      credits_used = credits_used + 1,
      updated_at = now()
  WHERE user_id = _user_id AND credits_remaining > 0;
  GET DIAGNOSTICS _updated = ROW_COUNT;
  RETURN _updated > 0;
END;
$$;
REVOKE ALL ON FUNCTION public.try_consume_credit(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.try_consume_credit(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.try_consume_credit(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.try_consume_credit(uuid) TO service_role;

-- 3. Refund helper (used when generation fails after optimistic deduction)
CREATE OR REPLACE FUNCTION public.refund_credit(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_credits
  SET credits_remaining = credits_remaining + 1,
      credits_used = GREATEST(credits_used - 1, 0),
      updated_at = now()
  WHERE user_id = _user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.refund_credit(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_credit(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.refund_credit(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.refund_credit(uuid) TO service_role;

-- 4. Restrict generations SELECT to the creator only (admins keep their own policy)
DROP POLICY IF EXISTS "Users can view generations for their brands" ON public.generations;
CREATE POLICY "Users can view their own generations"
ON public.generations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
