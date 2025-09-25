-- Module Coding Assistant Database Schema
-- Complete database structure for AI-powered coding assistant

-- 1. USER MANAGEMENT & AUTHENTICATION

-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'premium_user', 'regular_user');

-- Create user profiles table (references auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT,
    email TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    role user_role NOT NULL DEFAULT 'regular_user',
    subscription_tier TEXT DEFAULT 'free',
    total_ai_requests INTEGER DEFAULT 0,
    monthly_ai_requests INTEGER DEFAULT 0,
    last_request_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user settings table
CREATE TABLE public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'dark',
    language_preference TEXT DEFAULT 'en',
    code_editor_theme TEXT DEFAULT 'vs-dark',
    auto_save BOOLEAN DEFAULT true,
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. PROJECT MANAGEMENT

-- Create project status enum
CREATE TYPE public.project_status AS ENUM ('active', 'completed', 'archived', 'deleted');

-- Create projects table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status project_status DEFAULT 'active',
    framework TEXT, -- React, Vue, Angular, etc.
    language TEXT, -- JavaScript, TypeScript, Python, etc.
    repository_url TEXT,
    deploy_url TEXT,
    is_public BOOLEAN DEFAULT false,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. AI CONVERSATIONS & MESSAGING

-- Create conversation status enum
CREATE TYPE public.conversation_status AS ENUM ('active', 'archived', 'deleted');

-- Create conversations table (chat sessions)
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    status conversation_status DEFAULT 'active',
    total_messages INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message role enum
CREATE TYPE public.message_role AS ENUM ('user', 'assistant', 'system');

-- Create messages table
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB, -- Store additional data like token count, model used, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CODE MANAGEMENT

-- Create code snippet type enum
CREATE TYPE public.snippet_type AS ENUM ('component', 'function', 'hook', 'utility', 'full_file', 'other');

-- Create code snippets table
CREATE TABLE public.code_snippets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    code TEXT NOT NULL,
    language TEXT NOT NULL,
    snippet_type snippet_type DEFAULT 'other',
    file_path TEXT,
    is_favorite BOOLEAN DEFAULT false,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. AI REQUEST TRACKING

-- Create AI request status enum
CREATE TYPE public.ai_request_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

-- Create AI request type enum
CREATE TYPE public.ai_request_type AS ENUM ('code_generation', 'code_explanation', 'bug_fix', 'code_review', 'refactoring', 'documentation', 'other');

-- Create ai_requests table
CREATE TABLE public.ai_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    request_type ai_request_type NOT NULL,
    input_prompt TEXT NOT NULL,
    output_response TEXT,
    status ai_request_status DEFAULT 'pending',
    model_used TEXT,
    tokens_used INTEGER,
    processing_time_ms INTEGER,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 6. NOTIFICATIONS SYSTEM

-- Create notification type enum
CREATE TYPE public.notification_type AS ENUM ('info', 'success', 'warning', 'error', 'feature_update', 'system_maintenance');

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- 7. AUDIT & LOGGING

-- Create audit action enum
CREATE TYPE public.audit_action AS ENUM ('create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'share');

-- Create audit logs table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action audit_action NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. INDEXES FOR PERFORMANCE

-- User profiles indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Projects indexes
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);

-- Conversations indexes
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_project_id ON public.conversations(project_id);
CREATE INDEX idx_conversations_created_at ON public.conversations(created_at DESC);

-- Messages indexes
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- Code snippets indexes
CREATE INDEX idx_code_snippets_user_id ON public.code_snippets(user_id);
CREATE INDEX idx_code_snippets_project_id ON public.code_snippets(project_id);
CREATE INDEX idx_code_snippets_language ON public.code_snippets(language);
CREATE INDEX idx_code_snippets_tags ON public.code_snippets USING GIN(tags);

-- AI requests indexes
CREATE INDEX idx_ai_requests_user_id ON public.ai_requests(user_id);
CREATE INDEX idx_ai_requests_status ON public.ai_requests(status);
CREATE INDEX idx_ai_requests_created_at ON public.ai_requests(created_at DESC);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- 9. TRIGGERS FOR AUTOMATIC UPDATES

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_code_snippets_updated_at
    BEFORE UPDATE ON public.code_snippets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update conversation message count
CREATE OR REPLACE FUNCTION public.update_conversation_message_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger for message count updates
CREATE TRIGGER update_conversation_message_count_trigger
    AFTER INSERT OR DELETE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.update_conversation_message_count();

-- Function to update user AI request counts
CREATE OR REPLACE FUNCTION public.update_user_ai_request_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.profiles
        SET total_ai_requests = total_ai_requests + 1,
            monthly_ai_requests = monthly_ai_requests + 1
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for AI request count updates
CREATE TRIGGER update_user_ai_request_count_trigger
    AFTER INSERT ON public.ai_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_user_ai_request_count();