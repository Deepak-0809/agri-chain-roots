-- Fix function search path for security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$function$;

-- Recreate the existing functions with proper search path
CREATE OR REPLACE FUNCTION public.can_view_profile_field(profile_user_id uuid, field_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT CASE 
    WHEN auth.uid() = profile_user_id THEN true  -- Users can see their own data
    WHEN field_name IN ('display_name', 'avatar_url', 'role', 'created_at', 'user_id') THEN true  -- Public fields
    ELSE false  -- Private fields (email, phone, address)
  END;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_profile(profile_user_id uuid)
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, role text, created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.role,
    p.created_at
  FROM public.profiles p
  WHERE p.user_id = profile_user_id;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_profile_data(target_user_id uuid)
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, role text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.role
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
$function$;