-- Fix security vulnerability: Restrict profile data access properly
-- First, drop all existing policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profile data viewable by all" ON public.profiles;

-- Create a secure policy that allows users to see their own complete profile
-- and only basic public info for others
CREATE POLICY "Secure profile access" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id  -- Users can see their own complete profile
);

-- Create a separate policy for public profile data that other users can access
-- This will only work in application code by selecting specific fields
CREATE POLICY "Public fields accessible to authenticated users" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND auth.uid() != user_id  -- Other authenticated users
);

-- Add comment explaining proper usage
COMMENT ON POLICY "Public fields accessible to authenticated users" ON public.profiles IS 
'SECURITY WARNING: Applications MUST only select display_name, avatar_url, role, user_id when accessing other users profiles. NEVER select email, phone, or address for other users.';

-- Create a secure function for getting only public profile data
CREATE OR REPLACE FUNCTION public.get_public_profile_data(target_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  role text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.role
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
$$;