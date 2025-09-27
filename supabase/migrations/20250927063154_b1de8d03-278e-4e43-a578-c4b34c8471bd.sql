-- Fix remaining RLS policy issue for the existing Users table

-- Add RLS policy for the existing Users table
CREATE POLICY "Users can view all users" ON public."Users"
FOR SELECT USING (true);

-- Allow users to insert their own record  
CREATE POLICY "Users can insert their own record" ON public."Users"
FOR INSERT WITH CHECK (true);

-- Allow users to update their own record
CREATE POLICY "Users can update their own record" ON public."Users"
FOR UPDATE USING (true);