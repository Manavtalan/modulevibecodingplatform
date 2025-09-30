-- Create missing profile for existing user
INSERT INTO public.profiles (id, email, display_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'display_name', email)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Ensure the trigger is properly set up for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();