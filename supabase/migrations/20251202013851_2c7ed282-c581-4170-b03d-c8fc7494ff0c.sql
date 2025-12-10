-- Drop existing restrictive update policy
DROP POLICY IF EXISTS "Admins and responsible users can update requirements" ON public.framework_requirements;

-- Create new policy that allows all authenticated users to update requirements
CREATE POLICY "Authenticated users can update requirements"
ON public.framework_requirements
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);