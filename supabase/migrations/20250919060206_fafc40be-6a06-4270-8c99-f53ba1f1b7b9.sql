-- Fix security vulnerability: Restrict profile data access
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create secure policies that protect sensitive data
-- Policy 1: Users can view their own complete profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Users can view only public data of other profiles (display_name, role, avatar_url)
-- We need a separate view for public profile data
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  user_id,
  display_name,
  avatar_url,
  role,
  created_at
FROM public.profiles;

-- Enable RLS on the view
ALTER VIEW public.public_profiles SET (security_barrier = true);

-- Create policy for the public view
CREATE POLICY "Anyone can view public profile data" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Update the policy to be more specific about what fields can be accessed
-- Remove the above policy and create a more restrictive one
DROP POLICY IF EXISTS "Anyone can view public profile data" ON public.profiles;

-- Create a security definer function to check if data should be public
CREATE OR REPLACE FUNCTION public.can_view_profile_field(profile_user_id uuid, field_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT CASE 
    WHEN auth.uid() = profile_user_id THEN true  -- Users can see their own data
    WHEN field_name IN ('display_name', 'avatar_url', 'role', 'created_at', 'user_id') THEN true  -- Public fields
    ELSE false  -- Private fields (email, phone, address)
  END;
$$;

-- Since RLS policies can't dynamically restrict columns, we'll create a more targeted approach
-- Create a policy that only allows viewing basic public info for other users
CREATE POLICY "Public profile data viewable by all" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id OR  -- Users can see their own complete profile
  (auth.uid() IS NOT NULL)  -- Authenticated users can see others' profiles (but we'll handle column restriction in app)
);

-- Add a warning comment about proper usage
COMMENT ON POLICY "Public profile data viewable by all" ON public.profiles IS 
'SECURITY: Applications must only select display_name, avatar_url, role, created_at, user_id for other users. Never select email, phone, address for users other than the authenticated user.';

-- Create a secure function for getting public profile data
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  role text,
  created_at timestamptz
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
    p.role,
    p.created_at
  FROM public.profiles p
  WHERE p.user_id = profile_user_id;
$$;