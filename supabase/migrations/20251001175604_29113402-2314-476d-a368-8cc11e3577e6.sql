-- Fix security vulnerability: Remove overly permissive insertion policies
-- and restrict to service role only for system tables

-- 1. Fix notifications table - only service role can insert
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Service role can insert notifications"
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- 2. Fix audit_logs table - only service role can insert
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

CREATE POLICY "Service role can insert audit logs"
ON public.audit_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- 3. Fix profiles table - remove unrestricted service role policy
-- Keep the user self-insert policy and make service role policy more restrictive
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

CREATE POLICY "Service role can insert profiles"
ON public.profiles
FOR INSERT
TO service_role
WITH CHECK (true);