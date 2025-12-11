-- Fix critical RLS vulnerabilities: Restrict INSERT/UPDATE/DELETE to admins only

-- =====================================
-- framework_requirements table
-- =====================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert requirements" ON framework_requirements;
DROP POLICY IF EXISTS "Authenticated users can update requirements" ON framework_requirements;
DROP POLICY IF EXISTS "Authenticated users can delete requirements" ON framework_requirements;

-- Create admin-only policies for modifications
CREATE POLICY "Admins can insert requirements"
ON framework_requirements FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update requirements"
ON framework_requirements FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete requirements"
ON framework_requirements FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- =====================================
-- guideline_controls table
-- =====================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert controls" ON guideline_controls;
DROP POLICY IF EXISTS "Authenticated users can update controls" ON guideline_controls;
DROP POLICY IF EXISTS "Authenticated users can delete controls" ON guideline_controls;

-- Create admin-only policies for modifications
CREATE POLICY "Admins can insert controls"
ON guideline_controls FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update controls"
ON guideline_controls FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete controls"
ON guideline_controls FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));