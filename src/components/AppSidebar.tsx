// Importerer navigasjons- og ruting-komponenter
import { NavLink } from "@/components/NavLink"
import { useLocation } from "react-router-dom"
// Importerer auth-hook for å sjekke bruker-rolle
import { useAuth } from "@/hooks/useAuth"
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
} from "lucide-react"

// Importerer Sidebar-komponenter fra shadcn/ui
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
} from "@/components/ui/sidebar"

// Menyelementer: hver har tittel, URL og ikon
// Disse vises i sidebar-menyen
const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Onboarding", url: "/onboarding", icon: GraduationCap },
  { title: "Rammeverk", url: "/rammeverk", icon: FileText },
  { title: "Retningslinjer", url: "/retningslinjer", icon: BookOpen },
  { title: "Risikovurdering", url: "/risiko", icon: AlertTriangle },
  { title: "Dokumenter", url: "/dokumenter", icon: FolderOpen },
  { title: "Verktøy", url: "/verktoy", icon: Wrench },
  { title: "Rapporter", url: "/rapporter", icon: BarChart3 },
]

// Sidebar-komponent som viser navigasjonsmenyen
// Kan kollapses til ikon-modus
export function AppSidebar() {
  // Henter sidebar åpen-tilstand
  const { open } = useSidebar()
  // Henter nåværende lokasjon (URL-path)
  const location = useLocation()
  // Henter bruker-data og admin-status fra auth-hook
  const { isAdmin } = useAuth()

  // Sjekk om en rute er aktiv (brukes for å highlighte meny-element)
  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/"
    }
    return location.pathname.startsWith(path)
  }

  // Returnerer sidebar med kollapsbar ikon-modus
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          {/* Sidebar-tittel med ikon - skjuler tekst når collapsed */}
          <SidebarGroupLabel className="flex items-center gap-2 px-2">
            <Shield className="h-5 w-5 text-primary" />
            {open && <span className="font-semibold">EchoMedic</span>}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Viser alle menyelementer fra menuItems array */}
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {/* Menyelement med aktiv-status highlighting */}
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    {/* Navigasjonslenke til ruten */}
                    <NavLink to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Admin-lenke - kun synlig hvis bruker er administrator */}
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
  )
}
