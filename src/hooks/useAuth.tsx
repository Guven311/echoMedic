// Importerer React-hooks og typer fra Supabase
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// Type for auth-kontekst som vi deler via React Context
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

// Oppretter context - default er undefined for å oppdage feil bruk
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider som pakker appen og gir tilgang til auth-data
export function AuthProvider({ children }: { children: ReactNode }) {
  // Lokalt state for bruker, session og loading-flag
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChange gir oss realtime oppdateringer når bruker logger inn/ut
    // Vi abonnerer og oppdaterer state når hendelser skjer
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Oppdater session og user basert på det Supabase gir oss
        setSession(session);
        setUser(session?.user ?? null);
        // Når vi får en auth-hendelse, er vi ferdig med initial loading
        setLoading(false);
      }
    );

    // Ved mount sjekker vi om det allerede finnes en sesjon (f.eks. via cookie)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Cleanup: avregistrer Supabase-abonnementet når komponent unmountes
    return () => subscription.unsubscribe();
  }, []);

  // Enkelt API for å logge ut — kaller Supabase signOut
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Gjør auth-data tilgjengelig for alle children
  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for å konsumere auth-konteksten i komponenter
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Hjelpsom feilmelding hvis hook brukes uten Provider
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
