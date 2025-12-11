// Importerer toast-komponenter for varsler (både shadcn og sonner)
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
// Importerer tooltip-provider så tooltips fungerer overalt
import { TooltipProvider } from "@/components/ui/tooltip"
// React Query for data-henting og caching
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
// Router-komponenter for navigering mellom sider
import { BrowserRouter, Routes, Route } from "react-router-dom"
// Auth-provider som gir login-info til hele appen
import { AuthProvider } from "@/hooks/useAuth"
// Main layout-komponent med sidebar osv
import { Layout } from "@/components/Layout"
// Provider for lyst/mørkt tema
import { ThemeProvider } from "@/components/ThemeProvider"
// Importer alle sider
import Dashboard from "./pages/Dashboard"
import Rammeverk from "./pages/Rammeverk"
import Retningslinjer from "./pages/Retningslinjer"
import Risiko from "./pages/Risiko"
import Dokumenter from "./pages/Dokumenter"
import Verktoy from "./pages/Verktoy"
import Rapporter from "./pages/Rapporter"
import Onboarding from "./pages/Onboarding"
import Auth from "./pages/Auth"
import Admin from "./pages/Admin"
import NotFound from "./pages/NotFound"
import Profil from "./pages/Profil"

// Setter opp React Query - brukes til server state management
const queryClient = new QueryClient()

// Hovedkomponent - pakker hele appen med nødvendige providers i riktig rekkefølge
const App = () => (
  // QueryClient for data-henting
  <QueryClientProvider client={queryClient}>
    {/* Tema-provider - lyse/mørke modus */}
    <ThemeProvider defaultTheme="light" storageKey="echomedic-theme">
      {/* Tooltip-provider gjør tooltips tilgjengelige */}
      <TooltipProvider>
        {/* Auth-provider gir bruker-data */}
        <AuthProvider>
          {/* Toast-meldinger */}
          <Toaster />
          <Sonner />
          {/* Router - håndterer navigasjon */}
          <BrowserRouter>
            <Routes>
              {/* Innlogging - ingen sidebar */}
              <Route path="/auth" element={<Auth />} />

              {/* Alle øvrige ruter brukr Layout (med sidebar + header) */}
              <Route
                path="/"
                element={
                  <Layout>
                    <Dashboard />
                  </Layout>
                }
              />
              <Route
                path="/rammeverk"
                element={
                  <Layout>
                    <Rammeverk />
                  </Layout>
                }
              />
              <Route
                path="/retningslinjer"
                element={
                  <Layout>
                    <Retningslinjer />
                  </Layout>
                }
              />
              <Route
                path="/risiko"
                element={
                  <Layout>
                    <Risiko />
                  </Layout>
                }
              />
              <Route
                path="/dokumenter"
                element={
                  <Layout>
                    <Dokumenter />
                  </Layout>
                }
              />
              <Route
                path="/verktoy"
                element={
                  <Layout>
                    <Verktoy />
                  </Layout>
                }
              />
              <Route
                path="/rapporter"
                element={
                  <Layout>
                    <Rapporter />
                  </Layout>
                }
              />
              <Route
                path="/onboarding"
                element={
                  <Layout>
                    <Onboarding />
                  </Layout>
                }
              />
              <Route
                path="/profil"
                element={
                  <Layout>
                    <Profil />
                  </Layout>
                }
              />
              <Route
                path="/admin"
                element={
                  <Layout>
                    <Admin />
                  </Layout>
                }
              />

              {/* 404 - side som ikke finnes */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
)

export default App
