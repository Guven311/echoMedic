import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, AlertTriangle, Shield, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RiskMatrix } from "@/components/RiskMatrix";

interface IdentifiedThreat {
  title: string;
  description: string;
  probability: string;
  consequence: string;
  risk_score: number;
  mitigation: string;
}

interface IdentifiedVulnerability {
  title: string;
  description: string;
  severity: string;
  affected_area: string;
  recommendation: string;
}

interface RiskAnalysisResult {
  summary: string;
  overall_risk_level: string;
  identified_threats: IdentifiedThreat[];
  identified_vulnerabilities: IdentifiedVulnerability[];
  risk_matrix: {
    probability: string;
    consequence: string;
  };
  recommendations: string[];
}

export function RiskAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RiskAnalysisResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 52428800) {
        toast({
          title: "Filen er for stor",
          description: "Maksimum 50MB",
          variant: "destructive",
        });
        return;
      }
      setFile(f);
      setResult(null);
    }
  };

  const analyze = async () => {
    if (!file) {
      toast({
        title: "Feil",
        description: "Velg en fil først",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Ikke autentisert");

      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from("compliance-documents")
        .upload(filePath, file, { upsert: false });

      if (uploadErr) throw uploadErr;

      const { data, error } = await supabase.functions.invoke("analyze-risk", {
        body: { filePath, fileName: file.name },
      });

      if (error) throw error;

      if (data?.analysis_results) {
        setResult(data.analysis_results);
        toast({
          title: "Analyse fullført",
          description: `Risikonivå: ${getRiskLevelLabel(data.analysis_results.overall_risk_level)}`,
        });
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({
        title: "Feil",
        description: err.message || "Analyse feilet",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      lav: "Lav",
      middels: "Middels",
      hoy: "Høy",
      kritisk: "Kritisk",
    };
    return labels[level] || level;
  };

  const getRiskLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      lav: "bg-green-500",
      middels: "bg-yellow-500",
      hoy: "bg-orange-500",
      kritisk: "bg-red-500",
      low: "bg-green-500",
      medium: "bg-yellow-500",
      high: "bg-orange-500",
      critical: "bg-red-500",
    };
    return colors[level] || "bg-gray-500";
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      low: "secondary",
      medium: "outline",
      high: "default",
      critical: "destructive",
    };
    const labels: Record<string, string> = {
      low: "Lav",
      medium: "Middels",
      high: "Høy",
      critical: "Kritisk",
    };
    return <Badge variant={colors[severity] || "outline"}>{labels[severity] || severity}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Automatisk risikovurdering</CardTitle>
          <CardDescription>
            Last opp et dokument for å få en AI-basert risikoanalyse med identifiserte trusler, sårbarheter og risikomatrise
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Velg dokument</label>
            <input
              ref={inputRef}
              type="file"
              onChange={handleFile}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,.xml"
            />
            <Button
              onClick={() => inputRef.current?.click()}
              variant="outline"
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {file ? file.name : "Velg fil"}
            </Button>
          </div>

          <Button
            onClick={analyze}
            disabled={loading || !file}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyserer...
              </>
            ) : (
              "Start risikoanalyse"
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Overall Risk Level */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Samlet risikovurdering</CardTitle>
                <div className={`px-4 py-2 rounded-lg text-white font-bold ${getRiskLevelColor(result.overall_risk_level)}`}>
                  {getRiskLevelLabel(result.overall_risk_level)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{result.summary}</p>
            </CardContent>
          </Card>

          {/* Risk Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Risikomatrise</CardTitle>
              <CardDescription>
                Visuell fremstilling av samlet risiko basert på sannsynlighet og konsekvens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RiskMatrix
                probability={result.risk_matrix?.probability}
                consequence={result.risk_matrix?.consequence}
                onSelect={() => {}}
              />
            </CardContent>
          </Card>

          {/* Identified Threats */}
          {result.identified_threats && result.identified_threats.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <CardTitle>Identifiserte trusler</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.identified_threats.map((threat, i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{threat.title}</h4>
                        <p className="text-sm text-muted-foreground">{threat.description}</p>
                      </div>
                      <Badge variant={threat.risk_score >= 12 ? "destructive" : threat.risk_score >= 8 ? "default" : "secondary"}>
                        Score: {threat.risk_score}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Sannsynlighet: </span>
                        <span className="font-medium">{getRiskLevelLabel(threat.probability)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Konsekvens: </span>
                        <span className="font-medium">{getRiskLevelLabel(threat.consequence)}</span>
                      </div>
                    </div>
                    {threat.mitigation && (
                      <div className="pt-2 border-t">
                        <span className="text-sm text-muted-foreground">Tiltak: </span>
                        <span className="text-sm">{threat.mitigation}</span>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Identified Vulnerabilities */}
          {result.identified_vulnerabilities && result.identified_vulnerabilities.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-500" />
                  <CardTitle>Identifiserte sårbarheter</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.identified_vulnerabilities.map((vuln, i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{vuln.title}</h4>
                        <p className="text-sm text-muted-foreground">{vuln.description}</p>
                      </div>
                      {getSeverityBadge(vuln.severity)}
                    </div>
                    {vuln.affected_area && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Berørt område: </span>
                        <span>{vuln.affected_area}</span>
                      </div>
                    )}
                    {vuln.recommendation && (
                      <div className="pt-2 border-t">
                        <span className="text-sm text-muted-foreground">Anbefaling: </span>
                        <span className="text-sm">{vuln.recommendation}</span>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <CardTitle>Anbefalinger</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
