import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Threat {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  severity: string | null;
  source: string | null;
  created_at: string;
}

export default function Trusler() {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadThreats();
  }, []);

  const loadThreats = async () => {
    try {
      const { data, error } = await supabase
        .from("threats")
        .select("*")
        .order("severity", { ascending: false });

      if (error) throw error;
      setThreats(data || []);
    } catch (error) {
      console.error("Error loading threats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string | null) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      critical: { label: "Kritisk", variant: "destructive" },
      high: { label: "Høy", variant: "default" },
      medium: { label: "Middels", variant: "outline" },
      low: { label: "Lav", variant: "secondary" },
    };
    const c = config[severity || "medium"] || config.medium;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getCategoryIcon = (category: string | null) => {
    return <AlertTriangle className="h-5 w-5 text-orange-500" />;
  };

  const filteredThreats = threats.filter(
    (t) =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const threatsByCategory = filteredThreats.reduce((acc, threat) => {
    const cat = threat.category || "Ukategorisert";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(threat);
    return acc;
  }, {} as Record<string, Threat[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trusler</h1>
        <p className="text-muted-foreground">
          Oversikt over kjente trusler som brukes i risikovurderinger
        </p>
      </div>

      {/* Statistikk */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Totalt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{threats.length}</div>
            <p className="text-xs text-muted-foreground">trusler registrert</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Kritiske</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {threats.filter((t) => t.severity === "critical").length}
            </div>
            <p className="text-xs text-muted-foreground">trusler</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Høy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {threats.filter((t) => t.severity === "high").length}
            </div>
            <p className="text-xs text-muted-foreground">trusler</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Kategorier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(threatsByCategory).length}
            </div>
            <p className="text-xs text-muted-foreground">forskjellige</p>
          </CardContent>
        </Card>
      </div>

      {/* Søk */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søk etter trusler..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Trusler gruppert etter kategori */}
      {Object.entries(threatsByCategory).map(([category, categoryThreats]) => (
        <div key={category} className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {category}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {categoryThreats.map((threat) => (
              <Card key={threat.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(threat.category)}
                      <CardTitle className="text-lg">{threat.title}</CardTitle>
                    </div>
                    {getSeverityBadge(threat.severity)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{threat.description}</p>
                  {threat.source && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Kilde: {threat.source}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {filteredThreats.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Ingen trusler funnet
          </CardContent>
        </Card>
      )}
    </div>
  );
}
