-- Fjern eksisterende SELECT-policyer på profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Opprett ny kombinert policy som sikrer at brukere kun ser sin egen profil ELLER admin ser alle
CREATE POLICY "Users view own profile or admins view all"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);