// Importerer React Context og hooks
import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react"
// Importerer Supabase-typer for bruker- og sesjon-data
import { User, Session } from "@supabase/supabase-js"
// Importerer Supabase-klient
import { supabase } from "@/lib/supabase"

// Type-definisjon for auth-kontekst
// Dette er data som gjøres tilgjengelig for hele appen
interface AuthContextType {
  user: User | null // Innlogget bruker (null hvis ikke innlogget)
  session: Session | null // Bruker-sesjon med tokens
  loading: boolean // Loading-flag mens vi sjekker auth-status
  isAdmin: boolean // Admin-status fra database
  signOut: () => Promise<void> // Funksjon for å logge ut
}

// Oppretter React Context for auth
// Default er undefined for å oppdage hvis hook brukes uten Provider
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// AuthProvider-komponent som skal pakke hele appen
// Gjør auth-data tilgjengelig for alle child-komponenter
export function AuthProvider({ children }: { children: ReactNode }) {
  // Lokalt state for bruker-data
  const [user, setUser] = useState<User | null>(null)
  // Lokalt state for sesjon (inneholder tokens osv)
  const [session, setSession] = useState<Session | null>(null)
  // Loading-flag mens vi sjekker initial auth-status
  const [loading, setLoading] = useState(true)
  // Admin-status fra database
  const [isAdmin, setIsAdmin] = useState(false)

  // Funksjon for å sjekke admin-rolle fra database
  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single()

    setIsAdmin(!!data)
  }

  // Effect: subscribe til auth-hendelser og sjekk initial sesjon
  useEffect(() => {
    // onAuthStateChange gir oss realtime oppdateringer når bruker logger inn/ut
    // Vi abonnerer og oppdaterer state når hendelser skjer
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Oppdater session og user basert på hendelsen
      setSession(session)
      // Hvis sesjon finnes, hent bruker-data - ellers sett null
      setUser(session?.user ?? null)
      // Når vi får en auth-hendelse, er vi ferdig med initial loading
      setLoading(false)

      // Defer admin role check to avoid Supabase deadlock
      if (session?.user) {
        setTimeout(() => {
          checkAdminRole(session.user.id)
        }, 0)
      } else {
        setIsAdmin(false)
      }
    })

    // Ved mount sjekker vi om det allerede finnes en sesjon
    // Dette er viktig hvis bruker har cookie fra tidligere login
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Sjekk admin-rolle hvis bruker er innlogget
      if (session?.user) {
        checkAdminRole(session.user.id)
      }
    })

    // Cleanup: avregistrer Supabase-abonnementet når komponent unmountes
    // Ellers får vi memory leaks
    return () => subscription.unsubscribe()
  }, [])

  // Funksjon for å logge ut bruker
  const signOut = async () => {
    // Kaller Supabase signOut - fjerner sesjon fra browser
    await supabase.auth.signOut()
    setIsAdmin(false)
  }

  // Gjør auth-data tilgjengelig for alle children via Context
  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook for å bruke auth-konteksten i komponenter
// Brukes som: const { user, session, loading, isAdmin, signOut } = useAuth();
export function useAuth() {
  const context = useContext(AuthContext)
  // Hvis hook brukes uten AuthProvider, kast feilmelding
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
