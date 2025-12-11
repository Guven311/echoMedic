-- Drop the view with security definer and recreate with security invoker
DROP VIEW IF EXISTS public.audit_logs_safe;

-- Recreate view with SECURITY INVOKER (default, respects RLS)
CREATE VIEW public.audit_logs_safe 
WITH (security_invoker = true)
AS
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