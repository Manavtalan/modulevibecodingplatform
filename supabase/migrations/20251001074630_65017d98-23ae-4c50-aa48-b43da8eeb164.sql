-- Add INSERT policy for profiles table to allow users to create their own profile
-- This is a safety measure in addition to the handle_new_user trigger
-- Users can only insert a profile record where the id matches their auth.uid()

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Also add a policy to allow the service role to insert profiles
-- This ensures the trigger always works and provides a fallback
CREATE POLICY "Service role can insert profiles"
ON public.profiles
FOR INSERT
TO service_role
WITH CHECK (true);