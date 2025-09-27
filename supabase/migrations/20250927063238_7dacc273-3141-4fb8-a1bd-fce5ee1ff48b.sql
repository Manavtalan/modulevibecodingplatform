-- Sample data for testing the Module coding assistant app
-- This data will help you test all the features of your application

-- Note: Sample user profiles will be created automatically when users sign up through auth
-- The handle_new_user() trigger will create profile and settings records

-- Sample projects (these would be created after users sign up)
-- Commenting out as they require actual user IDs from auth.users
-- Uncomment and replace with real user IDs after authentication is implemented

/*
-- Sample conversations
INSERT INTO public.conversations (user_id, title, status) VALUES
    ('user-id-here', 'React Component Help', 'active'),
    ('user-id-here', 'Database Schema Design', 'active'),
    ('user-id-here', 'API Integration', 'archived');

-- Sample messages
INSERT INTO public.messages (conversation_id, role, content) VALUES
    ((SELECT id FROM public.conversations WHERE title = 'React Component Help' LIMIT 1), 'user', 'Can you help me create a responsive navigation component?'),
    ((SELECT id FROM public.conversations WHERE title = 'React Component Help' LIMIT 1), 'assistant', 'I''d be happy to help you create a responsive navigation component! Here''s a modern approach using React and Tailwind CSS...');

-- Sample code snippets
INSERT INTO public.code_snippets (user_id, title, description, code, language, snippet_type, tags) VALUES
    ('user-id-here', 'Responsive Navigation', 'A modern responsive navigation component', 'const Navigation = () => { return <nav>...</nav>; }', 'javascript', 'component', ARRAY['react', 'navigation', 'responsive']);
*/

-- Create some notification templates that can be used
-- These are examples of the types of notifications your system might send

-- Sample audit log entry structure (for documentation)
-- INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
-- VALUES ('user-id', 'create', 'projects', 'project-id', '{"title": "New Project", "status": "active"}');

-- Create indexes for better performance on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_messages_role ON public.messages(role);
CREATE INDEX IF NOT EXISTS idx_ai_requests_request_type ON public.ai_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_code_snippets_is_favorite ON public.code_snippets(is_favorite);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);