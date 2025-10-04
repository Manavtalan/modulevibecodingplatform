-- Add DELETE policy to Users table to prevent users from deleting other users' records
-- This ensures users can only delete their own record
CREATE POLICY "Users can delete own record"
  ON public."Users"
  FOR DELETE
  USING (auth.uid() = user_id);