// Importer React-hooks
import { useEffect, useState } from "react";
// Importer Supabase-klient
import { supabase } from "@/lib/supabase";
// Importer UI-komponenter
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Importer ikoner fra lucide
import { CheckCircle2, Clock, AlertCircle, TrendingUp } from "lucide-react";
// Importer routing-komponenter
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
// Importer egendefinert søk-komponent
import { DashboardSearch } from "@/components/DashboardSearch";

// Interface for dashboard-statistikk
interface Stats {
  totalFrameworks: number;
  totalGuidelines: number;
  totalRisks: number;
  totalDocuments: number;
  implementedCount: number;
  inProgressCount: number;
  notStartedCount: number;
}

// Dashboard-komponenten: viser oversikt over compliance-status
export default function Dashboard() {
  // State for statistikk
  const [stats, setStats] = useState<Stats>({
    totalFrameworks: 0,
    totalGuidelines: 0,
    totalRisks: 0,
    totalDocuments: 0,
    implementedCount: 0,
    inProgressCount: 0,
    notStartedCount: 0,
  });
  // Loading-state mens vi henter data
  const [loading, setLoading] = useState(true);

  // Kjør lastStats når komponenten monteres
  useEffect(() => {
    loadStats();
  }, []);

  // Hent statistikk fra Supabase
  const loadStats = async () => {
    try {
      // Parallelt: hent data fra alle nødvendige tabeller
      const [frameworks, guidelines, risks, documents, requirements, controls] = await Promise.all([
        supabase.from("frameworks").select("*", { count: "exact", head: true }),
        supabase.from("guidelines").select("*", { count: "exact", head: true }),
        supabase.from("risk_assessments").select("*", { count: "exact", head: true }),
        supabase.from("documents").select("*", { count: "exact", head: true }),
        supabase.from("framework_requirements").select("status"),
        supabase.from("guideline_controls").select("status"),
      ]);

      // Kombinér statuser fra både krav og kontroller
      const allStatuses = [
        ...(requirements.data || []).map((r) => r.status),
        ...(controls.data || []).map((c) => c.status),
      ];

      // Oppdater stats med antall for hver status-type
      setStats({
        totalFrameworks: frameworks.count || 0,
        totalGuidelines: guidelines.count || 0,
        totalRisks: risks.count || 0,
        totalDocuments: documents.count || 0,
        implementedCount: allStatuses.filter((s) => s === "implementert").length,
        inProgressCount: allStatuses.filter((s) => s === "pagaar").length,
        notStartedCount: allStatuses.filter((s) => s === "ikke_startet").length,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Konfigurering av status-kort (implementert, pågår, ikke startet)
  const statusCards = [
    {
      title: "Implementert",
      count: stats.implementedCount,
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Pågår",
      count: stats.inProgressCount,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Ikke startet",
      count: stats.notStartedCount,
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  // Vis loading-spinner mens data hentes
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Render: dashboard-innhold
  return (
    <div className="space-y-6">
      {/* Header med tittel og søk */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Oversikt over EchoMedic compliance-status
          </p>
        </div>
        {/* Søk-komponent */}
        <DashboardSearch />
      </div>

      {/* Status-kort (Implementert, Pågår, Ikke startet) */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Render hvert status-kort */}
        {statusCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              {/* Ikon med bakgrunn */}
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {/* Antall */}
              <div className="text-2xl font-bold">{card.count}</div>
              <p className="text-xs text-muted-foreground">krav og kontroller</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Hovednøkkeltall-kort: Rammeverk, Retningslinjer, Risikoer, Dokumenter */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Kort 1: Rammeverk */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Rammeverk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFrameworks}</div>
            <p className="text-xs text-muted-foreground">Normen & GDPR</p>
            <Link to="/rammeverk">
              <Button variant="link" className="p-0 h-auto mt-2">
                Se alle →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Kort 2: Retningslinjer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Retningslinjer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGuidelines}</div>
            <p className="text-xs text-muted-foreground">ISO-standarder</p>
            <Link to="/retningslinjer">
              <Button variant="link" className="p-0 h-auto mt-2">
                Se alle →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Kort 3: Risikovurderinger */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Risikovurderinger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRisks}</div>
            <p className="text-xs text-muted-foreground">identifiserte risikoer</p>
            <Link to="/risiko">
              <Button variant="link" className="p-0 h-auto mt-2">
                Se alle →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Kort 4: Dokumenter */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Dokumenter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">dokumenter lagret</p>
            <Link to="/dokumenter">
              <Button variant="link" className="p-0 h-auto mt-2">
                Se alle →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Hurtiglenker-kort */}
      <Card>
        <CardHeader>
          <CardTitle>Hurtiglenker</CardTitle>
          <CardDescription>Ofte brukte funksjoner</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Lenke til rammeverk */}
            <Link to="/rammeverk">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                Rammeverk oversikt
              </Button>
            </Link>
            {/* Lenke til risiko */}
            <Link to="/risiko">
              <Button variant="outline" className="w-full justify-start">
                <AlertCircle className="mr-2 h-4 w-4" />
                Ny risikovurdering
              </Button>
            </Link>
            {/* Lenke til dokumenter */}
            <Link to="/dokumenter">
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Last opp dokument
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
