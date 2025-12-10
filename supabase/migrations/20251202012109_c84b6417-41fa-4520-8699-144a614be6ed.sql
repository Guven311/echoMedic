-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;

-- Create new policy that allows users to view their own logs OR admins to view all
CREATE POLICY "Users can view their own logs or admins can view all"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  has_role(auth.uid(), 'admin'::app_role)
);