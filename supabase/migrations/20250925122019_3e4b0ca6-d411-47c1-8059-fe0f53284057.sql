-- Fix critical security issues: Enable RLS and create comprehensive policies

-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. SECURITY DEFINER FUNCTION FOR ROLE CHECKING

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id;
$$;

-- 3. RLS POLICIES FOR PROFILES TABLE

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

-- 4. RLS POLICIES FOR USER_SETTINGS TABLE

-- Users can view their own settings
CREATE POLICY "Users can view own settings" ON public.user_settings
FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update own settings" ON public.user_settings
FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert own settings" ON public.user_settings
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. RLS POLICIES FOR PROJECTS TABLE

-- Users can view their own projects
CREATE POLICY "Users can view own projects" ON public.projects
FOR SELECT USING (auth.uid() = user_id);

-- Users can view public projects
CREATE POLICY "Users can view public projects" ON public.projects
FOR SELECT USING (is_public = true);

-- Users can manage their own projects
CREATE POLICY "Users can insert own projects" ON public.projects
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
FOR DELETE USING (auth.uid() = user_id);

-- Admins can view all projects
CREATE POLICY "Admins can view all projects" ON public.projects
FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- 6. RLS POLICIES FOR CONVERSATIONS TABLE

-- Users can view their own conversations
CREATE POLICY "Users can view own conversations" ON public.conversations
FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own conversations
CREATE POLICY "Users can insert own conversations" ON public.conversations
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.conversations
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.conversations
FOR DELETE USING (auth.uid() = user_id);

-- 7. RLS POLICIES FOR MESSAGES TABLE

-- Users can view messages from their conversations
CREATE POLICY "Users can view own conversation messages" ON public.messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = conversation_id AND user_id = auth.uid()
  )
);

-- Users can insert messages to their conversations
CREATE POLICY "Users can insert messages to own conversations" ON public.messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = conversation_id AND user_id = auth.uid()
  )
);

-- Users can delete messages from their conversations
CREATE POLICY "Users can delete own conversation messages" ON public.messages
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = conversation_id AND user_id = auth.uid()
  )
);

-- 8. RLS POLICIES FOR CODE_SNIPPETS TABLE

-- Users can view their own code snippets
CREATE POLICY "Users can view own code snippets" ON public.code_snippets
FOR SELECT USING (auth.uid() = user_id);

-- Users can view code snippets from public projects
CREATE POLICY "Users can view public project code snippets" ON public.code_snippets
FOR SELECT USING (
  project_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND is_public = true
  )
);

-- Users can manage their own code snippets
CREATE POLICY "Users can insert own code snippets" ON public.code_snippets
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own code snippets" ON public.code_snippets
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own code snippets" ON public.code_snippets
FOR DELETE USING (auth.uid() = user_id);

-- 9. RLS POLICIES FOR AI_REQUESTS TABLE

-- Users can view their own AI requests
CREATE POLICY "Users can view own ai requests" ON public.ai_requests
FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own AI requests
CREATE POLICY "Users can insert own ai requests" ON public.ai_requests
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai requests" ON public.ai_requests
FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all AI requests
CREATE POLICY "Admins can view all ai requests" ON public.ai_requests
FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- 10. RLS POLICIES FOR NOTIFICATIONS TABLE

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

-- System can insert notifications for users
CREATE POLICY "System can insert notifications" ON public.notifications
FOR INSERT WITH CHECK (true);

-- Admins can manage all notifications
CREATE POLICY "Admins can manage all notifications" ON public.notifications
FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- 11. RLS POLICIES FOR AUDIT_LOGS TABLE

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON public.audit_logs
FOR INSERT WITH CHECK (true);

-- 12. FIX FUNCTION SECURITY ISSUES

-- Update existing functions to have proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert profile record
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
    );
    
    -- Insert default user settings
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_conversation_message_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.conversations 
        SET total_messages = total_messages + 1,
            updated_at = NOW()
        WHERE id = NEW.conversation_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.conversations 
        SET total_messages = GREATEST(total_messages - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.conversation_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_ai_request_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.profiles
        SET total_ai_requests = total_ai_requests + 1,
            monthly_ai_requests = monthly_ai_requests + 1
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$;