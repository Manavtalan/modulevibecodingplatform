-- Update default token quota to 500,000 for all users
-- This sets the global token limit as requested

-- Update the default value for new users
ALTER TABLE public.profiles 
ALTER COLUMN token_quota SET DEFAULT 500000;

-- Update existing users to have 500,000 token quota
UPDATE public.profiles 
SET token_quota = 500000 
WHERE token_quota = 1000000;

-- Add a comment for clarity
COMMENT ON COLUMN public.profiles.token_quota IS 'Maximum tokens allowed per user (input + output combined). Default: 500,000';