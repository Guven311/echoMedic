// Importerer navigasjons- og ruting-komponenter
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
// Importerer ikoner fra lucide-react
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  AlertTriangle,
  FolderOpen,
  Wrench,
  BarChart3,
  Shield,
  GraduationCap,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// Menyelementer med tittel, URL og ikon
const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Onboarding", url: "/onboarding", icon: GraduationCap },
  { title: "Rammeverk", url: "/rammeverk", icon: FileText },
  { title: "Retningslinjer", url: "/retningslinjer", icon: BookOpen },
  { title: "Risikovurdering", url: "/risiko", icon: AlertTriangle },
  { title: "Dokumenter", url: "/dokumenter", icon: FolderOpen },
  { title: "Verktøy", url: "/verktoy", icon: Wrench },
  { title: "Rapporter", url: "/rapporter", icon: BarChart3 },
];

// Sidebar-komponent som viser navigasjonsmenyen
export function AppSidebar() {
  // Henter sidebar åpen-tilstand og nåværende lokasjon
  const { open } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  // Sjekk admin-tilgang
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      // Admin e-post
      if (user.email === "admin@admin.no") {
        setIsAdmin(true);
        return;
      }

      // Sjekk rolle i database
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      setIsAdmin(!!data);
    };

    checkAdmin();
  }, [user]);

  // Sjekker om en rute er aktiv
  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  // Returnerer sidebar med kollapsbar ikon-modus
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          {/* Sidebar-tittel med ikon */}
          <SidebarGroupLabel className="flex items-center gap-2 px-2">
            <Shield className="h-5 w-5 text-primary" />
            {open && <span className="font-semibold">EchoMedic</span>}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Viser alle menyelementer */}
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {/* Menyelement med aktiv-status */}
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    {/* Navigasjonslenke */}
                    <NavLink to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {/* Admin-lenke - kun synlig for administratorer */}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin")}>
                    <NavLink to="/admin" className="flex items-center gap-3">
                      <Users className="h-4 w-4" />
                      <span>Administrasjon</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
