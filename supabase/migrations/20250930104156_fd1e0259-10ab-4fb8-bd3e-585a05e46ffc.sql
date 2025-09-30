-- Add user_id column to link to auth.users
ALTER TABLE public."Users" 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_users_user_id ON public."Users"(user_id);

-- Drop the insecure "Users can view all users" policy
DROP POLICY IF EXISTS "Users can view all users" ON public."Users";

-- Create secure policy: users can only view their own records
CREATE POLICY "Users can view own record"
ON public."Users"
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Update insert policy to ensure user_id is set correctly
DROP POLICY IF EXISTS "Users can insert their own record" ON public."Users";

CREATE POLICY "Users can insert own record"
ON public."Users"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Update update policy to ensure users can only update their own records
DROP POLICY IF EXISTS "Users can update their own record" ON public."Users";

CREATE POLICY "Users can update own record"
ON public."Users"
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);