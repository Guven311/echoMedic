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
// Importer toast-hook for meldinger
import { toast } from "@/hooks/use-toast";
import { Shield, ArrowLeft } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

// Auth-side med innlogging og 2FA
export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"login" | "2fa" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");

  // Handler: logg inn med e-post og passord
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const emailValue = formData.get("email") as string;
    const passwordValue = formData.get("password") as string;

    setEmail(emailValue);
    setPassword(passwordValue);

    // Først sjekk om dette er admin - da skipper vi 2FA
    if (emailValue.toLowerCase() === "admin@admin.no") {
      // Admin logger direkte inn uten 2FA
      const { error } = await supabase.auth.signInWithPassword({
        email: emailValue,
        password: passwordValue,
      });

      if (error) {
        toast({
          title: "Innlogging feilet",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Velkommen, Administrator!",
          description: "Du er nå logget inn.",
        });
        navigate("/");
      }
      setLoading(false);
      return;
    }

    // For vanlige brukere: Verifiser passord først
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: emailValue,
      password: passwordValue,
    });

    if (authError) {
      toast({
        title: "Innlogging feilet",
        description: authError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Logg ut midlertidig - vi krever 2FA
    await supabase.auth.signOut();

    // Send 2FA-kode
    try {
      const response = await supabase.functions.invoke("send-2fa-code", {
        body: { email: emailValue },
      });

      if (response.error) {
        throw new Error(response.error.message || "Kunne ikke sende 2FA-kode");
      }

      toast({
        title: "Kode sendt",
        description: "Vi har sendt en innloggingskode til din e-post.",
      });

      setStep("2fa");
    } catch (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke sende 2FA-kode. Prøv igjen.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  // Handler: verifiser 2FA-kode
  const handleVerify2FA = async () => {
    if (twoFactorCode.length !== 6) {
      toast({
        title: "Ugyldig kode",
        description: "Vennligst skriv inn alle 6 sifrene.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Verifiser koden
      const response = await supabase.functions.invoke("verify-2fa-code", {
        body: { email, code: twoFactorCode },
      });

      if (response.error || response.data?.error) {
        throw new Error(response.data?.error || "Ugyldig kode");
      }

      // Kode verifisert - logg inn brukeren
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Velkommen!",
        description: "Du er nå logget inn.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Feil",
        description: error instanceof Error ? error.message : "Ugyldig eller utløpt kode",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  // Handler: send passord-tilbakestillings-e-post
  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const redirectUrl = `${window.location.origin}/auth`;

    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: redirectUrl,
    });

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
      setStep("login");
      setForgotEmail("");
    }

    setLoading(false);
  };

  // Render glemt passord-steg
  if (step === "forgot") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Glemt passord</CardTitle>
            <CardDescription>
              Skriv inn din e-postadresse for å tilbakestille passordet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">E-post</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="din@epost.no"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sender..." : "Send tilbakestillingslenke"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("login");
                  setForgotEmail("");
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Tilbake til innlogging
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render 2FA-steg
  if (step === "2fa") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">To-faktor autentisering</CardTitle>
            <CardDescription>
              Skriv inn koden vi sendte til {email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <InputOTP 
                maxLength={6} 
                value={twoFactorCode}
                onChange={(value) => setTwoFactorCode(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button 
              className="w-full" 
              onClick={handleVerify2FA}
              disabled={loading || twoFactorCode.length !== 6}
            >
              {loading ? "Verifiserer..." : "Bekreft kode"}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setStep("login");
                setTwoFactorCode("");
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tilbake til innlogging
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render innlogging
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">EchoMedic</CardTitle>
          <CardDescription>
            Kvalitets- og samsvarsstyringssystem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="signin-password">Passord</Label>
                <Button
                  type="button"
                  variant="link"
                  className="px-0 h-auto font-normal text-sm text-muted-foreground"
                  onClick={() => setStep("forgot")}
                >
                  Glemt passord?
                </Button>
              </div>
              <Input
                id="signin-password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logger inn..." : "Logg inn"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
