// React hooks
import { useEffect, useState } from "react";
// Supabase-integrasjon
import { supabase } from "@/lib/supabase";
// UI-komponenter
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
// Egne komponenter for dialogs
import { AddRiskDialog } from "@/components/AddRiskDialog";
import { DeleteRiskDialog } from "@/components/DeleteRiskDialog";

// Interface for risikovurdering
interface RiskAssessment {
  id: string;
  title: string;
  description: string;
  category: string;
  probability: "lav" | "middels" | "hoy" | "kritisk";
  consequence: "lav" | "middels" | "hoy" | "kritisk";
  risk_score: number;
  treatment: "aksepter" | "reduser" | "overfor" | "unngaa";
  mitigation_plan: string | null;
  status: string;
}

// Risiko-side for håndtering av risikovurderinger
export default function Risiko() {
  // State for risiker
  const [risks, setRisks] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  // Last inn data når komponenten monteres
  useEffect(() => {
    loadRisks();
  }, []);

  // Hent alle risikovurderinger fra databasen
  const loadRisks = async () => {
    try {
      const { data } = await supabase
        .from("risk_assessments")
        .select("*")
        .order("risk_score", { ascending: false });

      setRisks(data || []);
    } catch (error) {
      console.error("Error loading risks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Hjelpe-funksjon: gi farge basert på risikoscore
  const getRiskColor = (score: number) => {
    if (score >= 12) return "bg-destructive text-destructive-foreground";
    if (score >= 8) return "bg-warning text-warning-foreground";
    if (score >= 4) return "bg-secondary text-secondary-foreground";
    return "bg-success text-success-foreground";
  };

  // Hjelpe-funksjon: gi tekstlabel basert på risikoscore
  const getRiskLabel = (score: number) => {
    if (score >= 12) return "Kritisk";
    if (score >= 8) return "Høy";
    if (score >= 4) return "Middels";
    return "Lav";
  };

  // Hjelpe-funksjon: oversett risikoenivå til norsk
  const translateLevel = (level: string) => {
    const translations: Record<string, string> = {
      lav: "Lav",
      middels: "Middels",
      hoy: "Høy",
      kritisk: "Kritisk",
    };
    return translations[level] || level;
  };

  // Hjelpe-funksjon: oversett risikobehandling til norsk
  const translateTreatment = (treatment: string) => {
    const translations: Record<string, string> = {
      aksepter: "Aksepter",
      reduser: "Reduser",
      overfor: "Overfør",
      unngaa: "Unngå",
    };
    return translations[treatment] || treatment;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Risikovurdering</h1>
          <p className="text-muted-foreground">
            Oversikt over identifiserte risikoer og behandlingsplaner
          </p>
        </div>
        <AddRiskDialog onRiskAdded={loadRisks} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Totalt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{risks.length}</div>
            <p className="text-xs text-muted-foreground">risikoer registrert</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Kritiske</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {risks.filter((r) => r.risk_score >= 12).length}
            </div>
            <p className="text-xs text-muted-foreground">krever umiddelbar handling</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Høy risiko</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {risks.filter((r) => r.risk_score >= 8 && r.risk_score < 12).length}
            </div>
            <p className="text-xs text-muted-foreground">krever oppfølging</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Under kontroll</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {risks.filter((r) => r.risk_score < 8).length}
            </div>
            <p className="text-xs text-muted-foreground">lav og middels risiko</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {risks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Ingen risikovurderinger registrert ennå
            </CardContent>
          </Card>
        ) : (
          risks.map((risk) => (
            <Card key={risk.id}>
              <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>{risk.title}</CardTitle>
                    </div>
                    {risk.description && (
                      <CardDescription>{risk.description}</CardDescription>
                    )}
                    {risk.category && (
                      <Badge variant="outline">{risk.category}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getRiskColor(risk.risk_score)}>
                      {getRiskLabel(risk.risk_score)} ({risk.risk_score})
                    </Badge>
                    <DeleteRiskDialog
                      riskId={risk.id}
                      riskTitle={risk.title}
                      onDeleted={loadRisks}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sannsynlighet</p>
                    <p className="text-sm">{translateLevel(risk.probability)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Konsekvens</p>
                    <p className="text-sm">{translateLevel(risk.consequence)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Behandling</p>
                    <p className="text-sm">{translateTreatment(risk.treatment)}</p>
                  </div>
                </div>
                {risk.mitigation_plan && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Tiltaksplan
                    </p>
                    <p className="text-sm">{risk.mitigation_plan}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
