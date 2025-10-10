-- Add token tracking fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS token_quota bigint DEFAULT 1000000,
ADD COLUMN IF NOT EXISTS tokens_used bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_token_reset timestamp with time zone DEFAULT now();

-- Create index for faster token queries
CREATE INDEX IF NOT EXISTS idx_profiles_tokens ON public.profiles(id, tokens_used, token_quota);

-- Add function to check and deduct tokens
CREATE OR REPLACE FUNCTION public.check_and_deduct_tokens(
  _user_id uuid,
  _tokens_to_use bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_quota bigint;
  current_used bigint;
  remaining bigint;
BEGIN
  -- Get current token usage
  SELECT token_quota, tokens_used
  INTO current_quota, current_used
  FROM public.profiles
  WHERE id = _user_id;
  
  remaining := current_quota - current_used;
  
  -- Check if user has enough tokens
  IF remaining < _tokens_to_use THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', remaining,
      'quota', current_quota,
      'used', current_used
    );
  END IF;
  
  -- Deduct tokens
  UPDATE public.profiles
  SET tokens_used = tokens_used + _tokens_to_use
  WHERE id = _user_id;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', remaining - _tokens_to_use,
    'quota', current_quota,
    'used', current_used + _tokens_to_use
  );
END;
$$;

-- Add function to get token usage
CREATE OR REPLACE FUNCTION public.get_token_usage(_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'quota', token_quota,
    'used', tokens_used,
    'remaining', token_quota - tokens_used,
    'percentage', ROUND((tokens_used::numeric / token_quota::numeric) * 100, 2)
  )
  FROM public.profiles
  WHERE id = _user_id;
$$;