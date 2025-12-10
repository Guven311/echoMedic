-- Update policies for guideline_controls to allow all authenticated users

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can insert controls" ON public.guideline_controls;
DROP POLICY IF EXISTS "Admins and responsible users can update controls" ON public.guideline_controls;

-- Create new policies that allow all authenticated users
CREATE POLICY "Authenticated users can insert controls"
ON public.guideline_controls
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update controls"
ON public.guideline_controls
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete controls"
ON public.guideline_controls
FOR DELETE
TO authenticated
USING (true);