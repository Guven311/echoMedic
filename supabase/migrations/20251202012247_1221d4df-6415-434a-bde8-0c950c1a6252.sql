-- Create policy that allows users to delete their own logs OR admins to delete any
CREATE POLICY "Users can delete their own logs or admins can delete any"
ON public.audit_logs
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  has_role(auth.uid(), 'admin'::app_role)
);