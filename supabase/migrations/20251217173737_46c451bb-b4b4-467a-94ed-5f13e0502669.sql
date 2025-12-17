-- Create threats table for known threats registry
CREATE TABLE public.threats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  severity TEXT DEFAULT 'medium',
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vulnerabilities table for vulnerability registry
CREATE TABLE public.vulnerabilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  owner_user_id UUID,
  related_framework_id UUID REFERENCES public.frameworks(id),
  related_guideline_id UUID REFERENCES public.guidelines(id),
  cve_id TEXT,
  affected_systems TEXT,
  remediation_plan TEXT,
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create risk_analysis_results table for storing AI analysis results
CREATE TABLE public.risk_analysis_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  analysis_results JSONB NOT NULL,
  identified_threats JSONB,
  identified_vulnerabilities JSONB,
  risk_matrix JSONB,
  overall_risk_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.threats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_analysis_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for threats (public read, admin manage)
CREATE POLICY "Everyone can view threats" ON public.threats FOR SELECT USING (true);
CREATE POLICY "Admins can manage threats" ON public.threats FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for vulnerabilities (public read, admin manage)
CREATE POLICY "Everyone can view vulnerabilities" ON public.vulnerabilities FOR SELECT USING (true);
CREATE POLICY "Admins can manage vulnerabilities" ON public.vulnerabilities FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for risk_analysis_results (user own data)
CREATE POLICY "Users can view their own risk analyses" ON public.risk_analysis_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own risk analyses" ON public.risk_analysis_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_threats_updated_at BEFORE UPDATE ON public.threats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_vulnerabilities_updated_at BEFORE UPDATE ON public.vulnerabilities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Insert sample threats
INSERT INTO public.threats (title, description, category, severity, source) VALUES
('Ransomware-angrep', 'Ondsinnet programvare som krypterer data og krever løsepenger', 'Malware', 'high', 'NIST'),
('Phishing', 'Sosial manipulering via e-post eller meldinger for å stjele legitimasjon', 'Social Engineering', 'high', 'ENISA'),
('DDoS-angrep', 'Distribuert tjenestenektangrep som overbelaster systemer', 'Network Attack', 'medium', 'CERT'),
('Innsidetrussel', 'Skade forårsaket av ansatte med tilgang til systemer', 'Insider Threat', 'high', 'ISO 27001'),
('Dataeksfiltrering', 'Uautorisert overføring av data ut av organisasjonen', 'Data Breach', 'critical', 'GDPR'),
('SQL-injeksjon', 'Angrep som utnytter sårbarheter i databasespørringer', 'Application Attack', 'high', 'OWASP'),
('Man-in-the-middle', 'Avlytting og manipulering av kommunikasjon', 'Network Attack', 'medium', 'NIST'),
('Brute force-angrep', 'Systematisk gjetting av passord', 'Authentication Attack', 'medium', 'CIS');

-- Insert sample vulnerabilities
INSERT INTO public.vulnerabilities (title, description, severity, status, affected_systems) VALUES
('Utdatert programvare', 'Flere servere kjører ikke-støttede versjoner av operativsystem', 'high', 'open', 'Servere'),
('Svake passordpolicyer', 'Minimum passordlengde er satt til 6 tegn', 'medium', 'in_progress', 'Active Directory'),
('Manglende kryptering', 'Data i hvile er ikke kryptert på alle systemer', 'high', 'open', 'Databaser'),
('Utilstrekkelig logging', 'Ikke alle kritiske hendelser logges', 'medium', 'open', 'Alle systemer'),
('Manglende MFA', 'Tofaktorautentisering er ikke aktivert for alle brukere', 'high', 'in_progress', 'Cloud-tjenester');