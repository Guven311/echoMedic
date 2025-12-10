// Importerer hooks og komponenter for layout
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { LogOut, User, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

// Props for layout-komponent
interface LayoutProps {
  children: ReactNode;
}

// Hovedlayout-komponent med sidebar og header
export function Layout({ children }: LayoutProps) {
  // Henter bruker-data, auth-tilstand og tema
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Laster profil og abonnerer på endringer
  useEffect(() => {
    if (user) {
      loadProfile();
      
      // Abonnerer på endringer i profiltabell
      const channel = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            // Oppdaterer avatar når profil endres
            if (payload.new && 'avatar_url' in payload.new) {
              setAvatarUrl(payload.new.avatar_url as string);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // Laster bruker-profil fra database
  const loadProfile = async () => {
    if (!user) return;
    
    // Henter avatar-URL fra profiltabell
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setAvatarUrl(data.avatar_url);
    }
  };

  // Viser loading-skjerm mens data hentes
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          {/* Spinner-animasjon */}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Laster...</p>
        </div>
      </div>
    );
  }

  // Sender til login hvis bruker ikke er autentisert
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Bruker første 2 tegn av e-post som initialer
  const initials = user.email?.substring(0, 2).toUpperCase() || "??";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Sidebar-navigasjon */}
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Topplinje med tema- og bruker-meny */}
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4">
            {/* Sidebar-toggle-knapp */}
            <SidebarTrigger />
            <div className="flex-1" />
            {/* Tema-toggle-knapp */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {/* Sol-ikon for light mode */}
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              {/* Måne-ikon for dark mode */}
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            {/* Bruker-meny dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/* Bruker-avatar-knapp */}
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    {avatarUrl && <AvatarImage src={avatarUrl} />}
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Bruker-epostadresse */}
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Profil-lenke */}
                <DropdownMenuItem onClick={() => navigate("/profil")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* Logg-ut-knapp */}
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logg ut</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          {/* Hovedinnhold-område */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
