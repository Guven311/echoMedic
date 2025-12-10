-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'bruker', 'revisor');
CREATE TYPE public.compliance_status AS ENUM ('implementert', 'pagaar', 'ikke_startet');
CREATE TYPE public.risk_level AS ENUM ('lav', 'middels', 'hoy', 'kritisk');
CREATE TYPE public.risk_treatment AS ENUM ('aksepter', 'reduser', 'overfor', 'unngaa');
CREATE TYPE public.document_status AS ENUM ('utkast', 'til_godkjenning', 'godkjent', 'arkivert');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'bruker',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Frameworks table (Normen, GDPR)
CREATE TABLE public.frameworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Framework requirements
CREATE TABLE public.framework_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  framework_id UUID NOT NULL REFERENCES public.frameworks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status compliance_status NOT NULL DEFAULT 'ikke_startet',
  responsible_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deadline DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guidelines table (ISO standards)
CREATE TABLE public.guidelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL, -- ISO 13485, ISO 42001, ISO 27001
  description TEXT,
  certification_status compliance_status,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guideline controls
CREATE TABLE public.guideline_controls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guideline_id UUID NOT NULL REFERENCES public.guidelines(id) ON DELETE CASCADE,
  control_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status compliance_status NOT NULL DEFAULT 'ikke_startet',
  responsible_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deadline DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Risk assessments
CREATE TABLE public.risk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- informasjonssikkerhet, kvalitet, AI, etc.
  probability risk_level NOT NULL,
  consequence risk_level NOT NULL,
  risk_score INTEGER GENERATED ALWAYS AS (
    CASE probability
      WHEN 'lav' THEN 1
      WHEN 'middels' THEN 2
      WHEN 'hoy' THEN 3
      WHEN 'kritisk' THEN 4
    END *
    CASE consequence
      WHEN 'lav' THEN 1
      WHEN 'middels' THEN 2
      WHEN 'hoy' THEN 3
      WHEN 'kritisk' THEN 4
    END
  ) STORED,
  treatment risk_treatment NOT NULL,
  mitigation_plan TEXT,
  status compliance_status NOT NULL DEFAULT 'ikke_startet',
  responsible_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  related_framework_id UUID REFERENCES public.frameworks(id) ON DELETE SET NULL,
  related_guideline_id UUID REFERENCES public.guidelines(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  version TEXT NOT NULL DEFAULT '1.0',
  status document_status NOT NULL DEFAULT 'utkast',
  category TEXT, -- kategori/mappe
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  related_framework_id UUID REFERENCES public.frameworks(id) ON DELETE SET NULL,
  related_guideline_id UUID REFERENCES public.guidelines(id) ON DELETE SET NULL,
  related_risk_id UUID REFERENCES public.risk_assessments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Templates and checklists
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- sjekkliste, mal, rapport
  content JSONB, -- flexible structure for different template types
  related_guideline_id UUID REFERENCES public.guidelines(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- deadline, status_change, new_task, etc.
  read BOOLEAN NOT NULL DEFAULT FALSE,
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.framework_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guideline_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for frameworks (all authenticated users can read)
CREATE POLICY "Authenticated users can view frameworks"
  ON public.frameworks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage frameworks"
  ON public.frameworks FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for framework_requirements
CREATE POLICY "Authenticated users can view requirements"
  ON public.framework_requirements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and responsible users can update requirements"
  ON public.framework_requirements FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    responsible_user_id = auth.uid()
  );

CREATE POLICY "Admins can insert requirements"
  ON public.framework_requirements FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for guidelines
CREATE POLICY "Authenticated users can view guidelines"
  ON public.guidelines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage guidelines"
  ON public.guidelines FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for guideline_controls
CREATE POLICY "Authenticated users can view controls"
  ON public.guideline_controls FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and responsible users can update controls"
  ON public.guideline_controls FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    responsible_user_id = auth.uid()
  );

CREATE POLICY "Admins can insert controls"
  ON public.guideline_controls FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for risk_assessments
CREATE POLICY "Authenticated users can view risks"
  ON public.risk_assessments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and responsible users can manage risks"
  ON public.risk_assessments FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    responsible_user_id = auth.uid()
  );

-- RLS Policies for documents
CREATE POLICY "Authenticated users can view documents"
  ON public.documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can upload documents"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Admins and uploaders can update documents"
  ON public.documents FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    uploaded_by = auth.uid()
  );

-- RLS Policies for templates
CREATE POLICY "Authenticated users can view templates"
  ON public.templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage templates"
  ON public.templates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  
  -- Assign default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'bruker');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_frameworks_updated_at
  BEFORE UPDATE ON public.frameworks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_framework_requirements_updated_at
  BEFORE UPDATE ON public.framework_requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_guidelines_updated_at
  BEFORE UPDATE ON public.guidelines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_guideline_controls_updated_at
  BEFORE UPDATE ON public.guideline_controls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_risk_assessments_updated_at
  BEFORE UPDATE ON public.risk_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Insert initial data for frameworks
INSERT INTO public.frameworks (name, description, sort_order) VALUES
  ('Normen', 'Norm for informasjonssikkerhet i helse- og omsorgssektoren', 1),
  ('GDPR', 'Personvernforordningen (General Data Protection Regulation)', 2);

-- Insert initial data for guidelines
INSERT INTO public.guidelines (name, code, description, sort_order) VALUES
  ('ISO 13485', 'ISO 13485:2016', 'Medisinsk utstyr - Kvalitetsstyringssystemer', 1),
  ('ISO 42001', 'ISO/IEC 42001:2023', 'Informasjonsteknologi - Kunstig intelligens - Styringssystem', 2),
  ('ISO 27001', 'ISO/IEC 27001:2022', 'Informasjonssikkerhet, cybersikkerhet og personvernbeskyttelse - Styringssystemer for informasjonssikkerhet', 3);