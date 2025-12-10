-- Create compliance_reports table
CREATE TABLE public.compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'utkast',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own reports or admins can view all"
ON public.compliance_reports
FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by 
  OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Authenticated users can create reports"
ON public.compliance_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own reports or admins can delete any"
ON public.compliance_reports
FOR DELETE
TO authenticated
USING (
  auth.uid() = created_by 
  OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can update their own reports or admins can update any"
ON public.compliance_reports
FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by 
  OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create trigger for updated_at
CREATE TRIGGER update_compliance_reports_updated_at
BEFORE UPDATE ON public.compliance_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();