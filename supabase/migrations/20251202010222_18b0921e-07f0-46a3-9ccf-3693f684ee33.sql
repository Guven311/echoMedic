-- Add DELETE policies for risk_assessments
CREATE POLICY "Users can delete their own risk assessments"
ON public.risk_assessments
FOR DELETE
USING (responsible_user_id = auth.uid());

-- Add DELETE policies for documents
CREATE POLICY "Users can delete their own documents"
ON public.documents
FOR DELETE
USING (uploaded_by = auth.uid());