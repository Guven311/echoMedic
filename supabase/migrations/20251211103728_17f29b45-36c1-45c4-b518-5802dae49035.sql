-- Fix profiles table RLS: Users should only see their own profile
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate with proper restrictions
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create a view for audit_logs that hides IP data from non-admins
CREATE OR REPLACE VIEW public.audit_logs_safe AS
SELECT 
  id,
  user_id,
  action,
  entity_type,
  entity_id,
  old_values,
  new_values,
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN ip_address
    ELSE NULL
  END as ip_address,
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN user_agent
    ELSE NULL
  END as user_agent,
  created_at
FROM public.audit_logs;

-- Grant access to the view
GRANT SELECT ON public.audit_logs_safe TO authenticated;