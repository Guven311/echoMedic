import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
// UI komponenter
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

// Type for bruker-profil
// Enkel profilmodell brukt i UI (kan være tom hvis ikke oppdatert)
interface Profile {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

// Profil-side hvor bruker kan endre info
// Enkel side for profilredigering — lett å forstå for en student
export default function Profil() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    email: "",
    avatar_url: null,
  });

  // Last profil når bruker logger inn
  // Bruker `useAuth` for å finne aktiv bruker og hente data
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  // Hent profil fra database
  // Enkel fetch fra `profiles`-tabellen, håndterer case når rad mangler
  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setProfile({
          full_name: data.full_name,
          email: data.email,
          avatar_url: data.avatar_url,
        });
      } else {
        setProfile({
          full_name: "",
          email: user?.email || "",
          avatar_url: null,
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Kunne ikke laste profil");
    } finally {
      setLoading(false);
    }
  };

  // Lagre endringer til profil
  // Triggeres når brukeren klikker "Lagre endringer".
  // Sender endringer til Supabase (upsert) og viser toast
  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user?.id,
          full_name: profile.full_name,
          email: profile.email,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast.success("Profil oppdatert");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Kunne ikke lagre profil");
    } finally {
      setSaving(false);
    }
  };

  // Håndter opplasting av profilbilde
  // Laster opp fil til Supabase Storage og oppdaterer `profiles.avatar_url`
  // Filinputen er skjult i UI, denne funksjonen kalles når bruker velger fil
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${user?.id}/avatar.${fileExt}`;

      // Last opp fil til storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Hent offentlig URL for bildet
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Oppdater profil med ny avatar-URL
      setProfile({ ...profile, avatar_url: data.publicUrl });

      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          user_id: user?.id,
          avatar_url: data.publicUrl,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (updateError) throw updateError;

      toast.success("Profilbilde oppdatert");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Kunne ikke laste opp profilbilde");
    } finally {
      setUploading(false);
    }
  };

  // Generer initialer fra navn eller epost (brukes i AvatarFallback)
  const initials = profile.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || user?.email?.substring(0, 2).toUpperCase() || "??";

  // Vis loading-spinner mens vi henter profil
  // Enkel placeholder mens API-kallet pågår
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Hoved-UI: profilvisning
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profil</h1>
        <p className="text-muted-foreground">
          Administrer profilinformasjonen din
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profilinformasjon</CardTitle>
          <CardDescription>
            Oppdater dine personlige opplysninger
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              {/* Fil-input (skjult) - åpnes via knapp under */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              {/* Knapp som åpner fil-velgeren */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Laster opp...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Last opp bilde
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                JPG, PNG eller WEBP (maks 2MB)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Fullt navn</Label>
              <Input
                id="full_name"
                value={profile.full_name || ""}
                onChange={(e) =>
                  setProfile({ ...profile, full_name: e.target.value })
                }
                placeholder="Ditt fulle navn"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                value={profile.email || ""}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
                placeholder="din@epost.no"
              />
            </div>
          </div>

          {/* Lagre-knapp for å sende endringer */}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Lagrer...
              </>
            ) : (
              "Lagre endringer"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
