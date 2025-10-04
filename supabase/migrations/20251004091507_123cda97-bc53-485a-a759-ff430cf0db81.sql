-- Remove email column from profiles table for security
-- Email is already stored securely in auth.users and should not be duplicated
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;