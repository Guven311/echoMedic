// Importer React-hooks og routing
import { useState } from "react";
import { useNavigate } from "react-router-dom";
// Importer Supabase-klient for auth-operasjoner
import { supabase } from "@/lib/supabase";
// Importer UI-komponenter fra shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Importer toast-hook for meldinger
import { toast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";

// Auth-side med innlogging, registrering og passord-gjenoppretting
export default function Auth() {
  const navigate = useNavigate();
  // Loading-state for å deaktivere knapper mens vi venter på server
  const [loading, setLoading] = useState(false);

  // Handler: logg inn med e-post og passord
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // Hent form-data fra skjemaet
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Forsøk innlogging via Supabase
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Håndter resultat
    if (error) {
      toast({
        title: "Innlogging feilet",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Velkommen!",
        description: "Du er nå logget inn.",
      });
      // Naviger til dashboard når innlogging lykkes
      navigate("/");
    }

    setLoading(false);
  };

  // Handler: registrer ny bruker
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // Hent form-verdier
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;

    // URL for e-post-bekreftelse
    const redirectUrl = `${window.location.origin}/`;

    // Opprett ny bruker i Supabase
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    // Vis resultat
    if (error) {
      toast({
        title: "Registrering feilet",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Registrering vellykket!",
        description: "Du kan nå logge inn med din nye konto.",
      });
    }

    setLoading(false);
  };

  // Handler: send passord-tilbakestillings-e-post
  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // Hent e-post fra skjema
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    // URL for tilbakestilling av passord
    const redirectUrl = `${window.location.origin}/auth/reset-password`;

    // Send tilbakestillings-e-post
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    // Vis resultat
    if (error) {
      toast({
        title: "Feil",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "E-post sendt",
        description: "Sjekk din e-post for å tilbakestille passord.",
      });
    }

    setLoading(false);
  };

  // Render: Auth-skjerm med kort for innlogging/registrering
  return (
    // Bakgrunn: gradient og sentrer innhold
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      {/* Kort som inneholder alle auth-faner */}
      <Card className="w-full max-w-md">
        {/* Header med logo og beskrivelse */}
        <CardHeader className="space-y-1 text-center">
          {/* Ikonbeholder */}
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          {/* Tittel */}
          <CardTitle className="text-2xl font-bold">EchoMedic</CardTitle>
          {/* Undertittel */}
          <CardDescription>
            Kvalitets- og samsvarsstyringssystem
          </CardDescription>
        </CardHeader>
        {/* Innhold: faner for innlogging, registrering, glemt passord */}
        <CardContent>
          {/* Fane-system */}
          <Tabs defaultValue="signin" className="w-full">
            {/* Fane-knapper */}
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin">Logg inn</TabsTrigger>
              <TabsTrigger value="signup">Registrer</TabsTrigger>
              <TabsTrigger value="forgot">Glemt passord</TabsTrigger>
            </TabsList>

            {/* Fane 1: Innlogging */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                {/* E-post-felt */}
                <div className="space-y-2">
                  <Label htmlFor="signin-email">E-post</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="din@epost.no"
                    required
                  />
                </div>
                {/* Passord-felt */}
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Passord</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                </div>
                {/* Innlogging-knapp */}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Logger inn..." : "Logg inn"}
                </Button>
              </form>
            </TabsContent>

            {/* Fane 2: Registrering */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                {/* Navn-felt */}
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Fullt navn</Label>
                  <Input
                    id="signup-name"
                    name="fullName"
                    type="text"
                    placeholder="Ola Nordmann"
                    required
                  />
                </div>
                {/* E-post-felt */}
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-post</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="din@epost.no"
                    required
                  />
                </div>
                {/* Passord-felt med minimumsvaring */}
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Passord</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 8 tegn
                  </p>
                </div>
                {/* Registrering-knapp */}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Registrerer..." : "Registrer konto"}
                </Button>
              </form>
            </TabsContent>

            {/* Fane 3: Glemt passord */}
            <TabsContent value="forgot">
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {/* E-post-felt for passord-tilbakestilling */}
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">E-post</Label>
                  <Input
                    id="forgot-email"
                    name="email"
                    type="email"
                    placeholder="din@epost.no"
                    required
                  />
                  {/* Hjelpe-tekst */}
                  <p className="text-xs text-muted-foreground">
                    Vi sender deg en e-post med instruksjoner for å tilbakestille passordet ditt.
                  </p>
                </div>
                {/* Knapp for å sende tilbakestillingslenke */}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sender..." : "Send tilbakestillingslenke"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
