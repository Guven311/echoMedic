-- Create courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content JSONB NOT NULL, -- Will contain course modules/sections
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_course_progress table
CREATE TABLE public.user_course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed_modules JSONB NOT NULL DEFAULT '[]', -- Array of completed module IDs
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;

-- Policies for courses (everyone can view)
CREATE POLICY "Everyone can view courses"
ON public.courses
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage courses"
ON public.courses
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policies for user_course_progress (private per user)
CREATE POLICY "Users can view their own progress"
ON public.user_course_progress
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress"
ON public.user_course_progress
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.user_course_progress
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_course_progress_updated_at
BEFORE UPDATE ON public.user_course_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Insert initial courses
INSERT INTO public.courses (title, description, content, sort_order, is_required) VALUES
(
  'Introduksjon til Compliance-systemet',
  'Lær hvordan du bruker compliance-systemet for å administrere rammeverk, retningslinjer og risikovurderinger',
  '{"modules": [
    {
      "id": "intro-1",
      "title": "Hva er compliance?",
      "content": "Compliance betyr å følge lover, regler og standarder. I helsesektoren er dette spesielt viktig for å sikre pasientsikkerhet og datavern. Dette systemet hjelper deg med å holde oversikt over alle krav vi må følge."
    },
    {
      "id": "intro-2", 
      "title": "Oversikt over systemet",
      "content": "Systemet består av flere hovedmoduler:\n\n• **Dashboard** - Oversikt over status og kommende frister\n• **Rammeverk** - Normen og GDPR krav\n• **Retningslinjer** - ISO-standarder (13485, 42001, 27001)\n• **Risiko** - Risikovurderinger og tiltaksplaner\n• **Dokumenter** - Sentral dokumenthåndtering\n• **Rapporter** - Aktivitetslogg og compliance-rapporter"
    },
    {
      "id": "intro-3",
      "title": "Din rolle",
      "content": "Som bruker har du ansvar for å:\n\n• Holde oversikt over dine tildelte krav og kontroller\n• Oppdatere status på oppgaver\n• Dokumentere gjennomførte tiltak\n• Varsle om avvik eller problemer\n\nAdministratorer har utvidet tilgang til å administrere alle moduler."
    }
  ]}'::jsonb,
  1,
  true
),
(
  'Informasjonssikkerhet og GDPR',
  'Grunnleggende opplæring i informasjonssikkerhet, personvern og GDPR',
  '{"modules": [
    {
      "id": "gdpr-1",
      "title": "Hva er GDPR?",
      "content": "General Data Protection Regulation (GDPR) er EUs personvernforordning som beskytter personopplysninger. Den gir enkeltpersoner kontroll over egne data og stiller strenge krav til hvordan vi behandler personopplysninger.\n\n**Viktige prinsipper:**\n• Lovlighet, rettferdighet og åpenhet\n• Formålsbegrensning\n• Dataminimering\n• Riktighet\n• Lagringsbegrensning\n• Integritet og konfidensialitet"
    },
    {
      "id": "gdpr-2",
      "title": "Dine plikter",
      "content": "Som ansatt må du:\n\n• **Kun behandle personopplysninger når det er nødvendig** for ditt arbeid\n• **Aldri dele** pasientinformasjon utenfor godkjente systemer\n• **Lås skjermen** når du forlater arbeidsplassen\n• **Bruk sterke passord** og aldri del dem\n• **Rapporter umiddelbart** hvis du oppdager et databrudd\n• **Ta opplæring** i informasjonssikkerhet årlig"
    },
    {
      "id": "gdpr-3",
      "title": "Konsekvenser ved brudd",
      "content": "Brudd på personvernreglene kan få alvorlige konsekvenser:\n\n• **For organisasjonen:** Bøter opp til 20 millioner euro eller 4% av global omsetning\n• **For deg:** Disiplinære reaksjoner, oppsigelse, evt. strafferettslig ansvar\n• **For pasienter:** Tap av tillit, potensielt personskade\n\n**Eksempler på brudd:**\n• Sende pasientinfo til feil mottaker\n• Etterlate utskrifter synlige\n• Bruke usikrede USB-er\n• Diskutere pasienter på offentlige steder"
    }
  ]}'::jsonb,
  2,
  true
),
(
  'Risikovurdering og tiltaksplaner',
  'Hvordan identifisere, vurdere og håndtere risiko i compliance-arbeidet',
  '{"modules": [
    {
      "id": "risk-1",
      "title": "Hva er risiko?",
      "content": "Risiko er muligheten for at noe uønsket kan skje og konsekvensene det får. I compliance-sammenheng handler det om risiko for:\n\n• **Manglende etterlevelse** av lover og regler\n• **Databrudd** og tap av personopplysninger\n• **Svikt i kvalitetssystemer**\n• **Pasientsikkerhetshendelser**\n\nVi må kontinuerlig identifisere og håndtere disse risikoene."
    },
    {
      "id": "risk-2",
      "title": "Risikovurdering i praksis",
      "content": "Når du vurderer risiko skal du se på:\n\n**Sannsynlighet:**\n• Lav: Sjelden eller svært usannsynlig\n• Middels: Kan skje av og til\n• Høy: Skjer ofte eller er sannsynlig\n\n**Konsekvens:**\n• Lav: Små konsekvenser, lett å håndtere\n• Middels: Moderate konsekvenser\n• Høy: Alvorlige konsekvenser\n• Kritisk: Katastrofale konsekvenser\n\nRisikoen = Sannsynlighet × Konsekvens"
    },
    {
      "id": "risk-3",
      "title": "Tiltaksplaner",
      "content": "For hver identifisert risiko må vi ha en tiltaksplan:\n\n**Fire strategier:**\n• **Aksepter** - Risikoen er så lav at vi kan leve med den\n• **Reduser** - Iverksett tiltak for å senke risiko\n• **Overfør** - Flytt risikoen til andre (f.eks. forsikring)\n• **Unngå** - Slutt med aktiviteten som skaper risiko\n\nI systemet registrerer du:\n• Risikobeskrivelse\n• Vurdering av sannsynlighet og konsekvens\n• Valgt behandlingsstrategi\n• Konkrete tiltak\n• Ansvarlig person og frist"
    }
  ]}'::jsonb,
  3,
  true
);