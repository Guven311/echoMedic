import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import { ThemeProvider } from "@/components/ThemeProvider";
import Dashboard from "./pages/Dashboard";
import Rammeverk from "./pages/Rammeverk";
import Retningslinjer from "./pages/Retningslinjer";
import Risiko from "./pages/Risiko";
import Dokumenter from "./pages/Dokumenter";
import Verktoy from "./pages/Verktoy";
import Rapporter from "./pages/Rapporter";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Profil from "./pages/Profil";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="echomedic-theme">
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            <Route path="/rammeverk" element={<Layout><Rammeverk /></Layout>} />
            <Route path="/retningslinjer" element={<Layout><Retningslinjer /></Layout>} />
            <Route path="/risiko" element={<Layout><Risiko /></Layout>} />
            <Route path="/dokumenter" element={<Layout><Dokumenter /></Layout>} />
            <Route path="/verktoy" element={<Layout><Verktoy /></Layout>} />
            <Route path="/rapporter" element={<Layout><Rapporter /></Layout>} />
            <Route path="/onboarding" element={<Layout><Onboarding /></Layout>} />
            <Route path="/profil" element={<Layout><Profil /></Layout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
