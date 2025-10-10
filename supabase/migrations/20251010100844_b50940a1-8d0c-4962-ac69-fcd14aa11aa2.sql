-- Create storage bucket for chat file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-uploads',
  'chat-uploads',
  false,
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
);

-- RLS policies for chat-uploads bucket
CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create table for chat file attachments
CREATE TABLE public.chat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on chat_attachments
ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_attachments
CREATE POLICY "Users can view their own attachments"
ON public.chat_attachments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attachments"
ON public.chat_attachments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attachments"
ON public.chat_attachments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create table for GitHub connections
CREATE TABLE public.github_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  github_username TEXT,
  github_user_id TEXT,
  access_token TEXT, -- encrypted in practice
  repo_url TEXT,
  repo_name TEXT,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  UNIQUE(user_id, repo_url)
);

-- Enable RLS on github_connections
ALTER TABLE public.github_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies for github_connections
CREATE POLICY "Users can view their own GitHub connections"
ON public.github_connections
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own GitHub connections"
ON public.github_connections
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own GitHub connections"
ON public.github_connections
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own GitHub connections"
ON public.github_connections
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX idx_chat_attachments_user_id ON public.chat_attachments(user_id);
CREATE INDEX idx_chat_attachments_conversation_id ON public.chat_attachments(conversation_id);
CREATE INDEX idx_github_connections_user_id ON public.github_connections(user_id);
CREATE INDEX idx_github_connections_active ON public.github_connections(user_id, is_active);