import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Search, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Vulnerability {
  id: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  owner_user_id: string | null;
  related_framework_id: string | null;
  related_guideline_id: string | null;
  cve_id: string | null;
  affected_systems: string | null;
  remediation_plan: string | null;
  discovered_at: string | null;
  created_at: string;
}

interface Framework {
  id: string;
  name: string;
}

interface Guideline {
  id: string;
  code: string;
  name: string;
}

export default function Sarbarheter() {
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [vulnResult, frameworksResult, guidelinesResult] = await Promise.all([
        supabase.from("vulnerabilities").select("*").order("severity", { ascending: false }),
        supabase.from("frameworks").select("id, name"),
        supabase.from("guidelines").select("id, code, name"),
      ]);

      setVulnerabilities(vulnResult.data || []);
      setFrameworks(frameworksResult.data || []);
      setGuidelines(guidelinesResult.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      critical: { label: "Kritisk", variant: "destructive" },
      high: { label: "Høy", variant: "default" },
      medium: { label: "Middels", variant: "outline" },
      low: { label: "Lav", variant: "secondary" },
    };
    const c = config[severity] || config.medium;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; icon: JSX.Element; className: string }> = {
      open: { label: "Åpen", icon: <AlertCircle className="h-3 w-3" />, className: "bg-red-100 text-red-800" },
      in_progress: { label: "Under arbeid", icon: <Clock className="h-3 w-3" />, className: "bg-yellow-100 text-yellow-800" },
      resolved: { label: "Løst", icon: <CheckCircle2 className="h-3 w-3" />, className: "bg-green-100 text-green-800" },
      mitigated: { label: "Redusert", icon: <Shield className="h-3 w-3" />, className: "bg-blue-100 text-blue-800" },
    };
    const c = config[status] || config.open;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${c.className}`}>
        {c.icon}
        {c.label}
      </span>
    );
  };

  const getFrameworkName = (id: string | null) => {
    if (!id) return null;
    return frameworks.find((f) => f.id === id)?.name;
  };

  const getGuidelineName = (id: string | null) => {
    if (!id) return null;
    const g = guidelines.find((g) => g.id === id);
    return g ? `${g.code} - ${g.name}` : null;
  };

  const filteredVulnerabilities = vulnerabilities.filter(
    (v) =>
      v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.affected_systems?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openVulns = filteredVulnerabilities.filter((v) => v.status === "open");
  const inProgressVulns = filteredVulnerabilities.filter((v) => v.status === "in_progress");
  const resolvedVulns = filteredVulnerabilities.filter((v) => v.status === "resolved" || v.status === "mitigated");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const VulnerabilityCard = ({ vuln }: { vuln: Vulnerability }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              <CardTitle className="text-lg">{vuln.title}</CardTitle>
            </div>
            {vuln.cve_id && (
              <Badge variant="outline" className="text-xs">
                {vuln.cve_id}
              </Badge>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {getSeverityBadge(vuln.severity)}
            {getStatusBadge(vuln.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{vuln.description}</p>

        {vuln.affected_systems && (
          <div className="text-sm">
            <span className="font-medium">Berørte systemer: </span>
            <span className="text-muted-foreground">{vuln.affected_systems}</span>
          </div>
        )}

        {(vuln.related_framework_id || vuln.related_guideline_id) && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {getFrameworkName(vuln.related_framework_id) && (
              <Badge variant="secondary">{getFrameworkName(vuln.related_framework_id)}</Badge>
            )}
            {getGuidelineName(vuln.related_guideline_id) && (
              <Badge variant="secondary">{getGuidelineName(vuln.related_guideline_id)}</Badge>
            )}
          </div>
        )}

        {vuln.remediation_plan && (
          <div className="pt-2 border-t">
            <span className="text-sm font-medium">Utbedringsplan: </span>
            <p className="text-sm text-muted-foreground">{vuln.remediation_plan}</p>
          </div>
        )}

        {vuln.discovered_at && (
          <p className="text-xs text-muted-foreground">
            Oppdaget: {new Date(vuln.discovered_at).toLocaleDateString("nb-NO")}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sårbarheter</h1>
        <p className="text-muted-foreground">
          Sårbarhetsregister knyttet til rammeverk som ISO 27001, Normen og GDPR
        </p>
      </div>

      {/* Statistikk */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Totalt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vulnerabilities.length}</div>
            <p className="text-xs text-muted-foreground">sårbarheter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Åpne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {vulnerabilities.filter((v) => v.status === "open").length}
            </div>
            <p className="text-xs text-muted-foreground">krever handling</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Under arbeid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {vulnerabilities.filter((v) => v.status === "in_progress").length}
            </div>
            <p className="text-xs text-muted-foreground">pågående</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Kritiske</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {vulnerabilities.filter((v) => v.severity === "critical" || v.severity === "high").length}
            </div>
            <p className="text-xs text-muted-foreground">høy/kritisk</p>
          </CardContent>
        </Card>
      </div>

      {/* Søk */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søk etter sårbarheter..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Faner etter status */}
      <Tabs defaultValue="open" className="space-y-4">
        <TabsList>
          <TabsTrigger value="open">
            Åpne ({openVulns.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            Under arbeid ({inProgressVulns.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Løst ({resolvedVulns.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Alle ({filteredVulnerabilities.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
          {openVulns.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Ingen åpne sårbarheter
              </CardContent>
            </Card>
          ) : (
            openVulns.map((vuln) => <VulnerabilityCard key={vuln.id} vuln={vuln} />)
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4">
          {inProgressVulns.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Ingen sårbarheter under arbeid
              </CardContent>
            </Card>
          ) : (
            inProgressVulns.map((vuln) => <VulnerabilityCard key={vuln.id} vuln={vuln} />)
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {resolvedVulns.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Ingen løste sårbarheter
              </CardContent>
            </Card>
          ) : (
            resolvedVulns.map((vuln) => <VulnerabilityCard key={vuln.id} vuln={vuln} />)
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {filteredVulnerabilities.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Ingen sårbarheter funnet
              </CardContent>
            </Card>
          ) : (
            filteredVulnerabilities.map((vuln) => <VulnerabilityCard key={vuln.id} vuln={vuln} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
