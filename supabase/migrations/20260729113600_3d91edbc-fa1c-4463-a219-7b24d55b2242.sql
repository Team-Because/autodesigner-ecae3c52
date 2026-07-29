
CREATE OR REPLACE FUNCTION public.try_consume_credit(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _updated integer;
  _email text;
BEGIN
  SELECT email INTO _email FROM auth.users WHERE id = _user_id;
  IF _email = 'web@teambecause.com' THEN
    RETURN true;
  END IF;

  UPDATE public.user_credits
  SET credits_remaining = credits_remaining - 1,
      credits_used = credits_used + 1,
      updated_at = now()
  WHERE user_id = _user_id AND credits_remaining > 0;
  GET DIAGNOSTICS _updated = ROW_COUNT;
  RETURN _updated > 0;
END;
$function$;

CREATE OR REPLACE FUNCTION public.refund_credit(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _email text;
BEGIN
  SELECT email INTO _email FROM auth.users WHERE id = _user_id;
  IF _email = 'web@teambecause.com' THEN
    RETURN;
  END IF;

  UPDATE public.user_credits
  SET credits_remaining = credits_remaining + 1,
      credits_used = GREATEST(credits_used - 1, 0),
      updated_at = now()
  WHERE user_id = _user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.deduct_credit(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _email text;
BEGIN
  SELECT email INTO _email FROM auth.users WHERE id = _user_id;
  IF _email = 'web@teambecause.com' THEN
    RETURN;
  END IF;

  UPDATE public.user_credits
  SET credits_remaining = GREATEST(credits_remaining - 1, 0),
      credits_used = credits_used + 1,
      updated_at = now()
  WHERE user_id = _user_id;
END;
$function$;
