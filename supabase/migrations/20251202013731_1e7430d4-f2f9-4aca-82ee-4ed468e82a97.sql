-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can insert requirements" ON public.framework_requirements;

-- Create new policy that allows all authenticated users to insert requirements
CREATE POLICY "Authenticated users can insert requirements"
ON public.framework_requirements
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create new policy that allows users to delete requirements (currently no delete policy exists for non-admins)
CREATE POLICY "Authenticated users can delete requirements"
ON public.framework_requirements
FOR DELETE
TO authenticated
USING (true);