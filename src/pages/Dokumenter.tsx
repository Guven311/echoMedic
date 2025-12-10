// Importer React-hooks
import { useEffect, useState } from "react";
// Importer Supabase-klient
import { supabase } from "@/lib/supabase";
// Importer UI-komponenter fra shadcn
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Importer ikoner
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Importer egendefinerte komponenter for dokumenter
import { DocumentAnalyzer } from "@/components/DocumentAnalyzer";
import { DeleteDocumentDialog } from "@/components/DeleteDocumentDialog";
// Interface for dokumenter fra databasen
interface Document {
  id: string;
  title: string;
  description: string | null;
  file_name: string | null;
  file_path: string | null;
  version: string;
  status: "utkast" | "til_godkjenning" | "godkjent" | "arkivert";
  category: string | null;
  created_at: string;
}
// Dokumenter-side: administrasjon og analyse av dokumenter
export default function Dokumenter() {
  // State for dokumenter
  const [documents, setDocuments] = useState<Document[]>([]);
  // State for retningslinjer (brukt i analyzer)
  const [guidelines, setGuidelines] = useState<any[]>([]);
  // Loading-state
  const [loading, setLoading] = useState(true);
  // Hent dokumenter og retningslinjer når komponenten monteres
  useEffect(() => {
    loadDocuments();
  }, []);
  const loadDocuments = async () => {
    try {
      const [docsResult, guidelinesResult] = await Promise.all([supabase.from("documents").select("*").order("created_at", {
        ascending: false
      }), supabase.from("guidelines").select("id, code, name").order("sort_order")]);
      setDocuments(docsResult.data || []);
      setGuidelines(guidelinesResult.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };
  // Hjelpe-funksjon: map status-tekst til badge-utseende
  const getStatusBadge = (status: string) => {
    // Konfigurering for hver status-type
    const variants = {
      utkast: {
        label: "Utkast",
        variant: "secondary" as const
      },
      til_godkjenning: {
        label: "Til godkjenning",
        variant: "outline" as const
      },
      godkjent: {
        label: "Godkjent",
        variant: "default" as const
      },
      arkivert: {
        label: "Arkivert",
        variant: "outline" as const
      }
    };
    // Hent config og rendre badge
    const config = variants[status as keyof typeof variants];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };
  // Vis loading-spinner mens vi henter data
  if (loading) {
    return <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>;
  }

  // Render: dokumenter-side
  return <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dokumenter</h1>
        <p className="text-muted-foreground">
          Last opp og analyser EchoMedic - dokumenter med AI
        </p>
      </div>

      {/* Fane-system: AI-analyse eller dokumentoversikt */}
      <Tabs defaultValue="analyze" className="space-y-4">
        {/* Fane-knapper */}
        <TabsList>
          <TabsTrigger value="analyze">AI-analyse</TabsTrigger>
          <TabsTrigger value="overview">Dokumentoversikt</TabsTrigger>
        </TabsList>

        {/* Fane 1: AI-analyse av dokumenter */}
        <TabsContent value="analyze">
          <DocumentAnalyzer guidelines={guidelines} />
        </TabsContent>

        {/* Fane 2: Dokumentoversikt */}
        <TabsContent value="overview">
          {/* Statistikk-kort for status-oppsummering */}
          {/* Statistikk-kort for status-oppsummering */}
          <div className="grid gap-4 md:grid-cols-4">
            {/* Totalt antall dokumenter */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Totalt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documents.length}</div>
                <p className="text-xs text-muted-foreground">dokumenter</p>
              </CardContent>
            </Card>

            {/* Godkjente dokumenter */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Godkjent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {documents.filter(d => d.status === "godkjent").length}
                </div>
                <p className="text-xs text-muted-foreground">dokumenter</p>
              </CardContent>
            </Card>

            {/* Dokumenter til godkjenning */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Til godkjenning</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {documents.filter(d => d.status === "til_godkjenning").length}
                </div>
                <p className="text-xs text-muted-foreground">venter på godkjenning</p>
              </CardContent>
            </Card>

            {/* Utkast-dokumenter */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Utkast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {documents.filter(d => d.status === "utkast").length}
                </div>
                <p className="text-xs text-muted-foreground">under arbeid</p>
              </CardContent>
            </Card>
          </div>

          {/* Dokumentliste */}
          <div className="space-y-4 mt-6">
            {/* Tom-tilstand eller dokumentliste */}
            {documents.length === 0 ? <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Ingen dokumenter lastet opp ennå
                </CardContent>
              </Card> : documents.map(doc => <Card key={doc.id}>
                  {/* Dokument-header med metadata */}
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        {/* Tittel med ikon */}
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <CardTitle>{doc.title}</CardTitle>
                        </div>
                        {/* Beskrivelse */}
                        {doc.description && <CardDescription>{doc.description}</CardDescription>}
                        {/* Badges: kategori, versjon, status */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {doc.category && <Badge variant="outline">{doc.category}</Badge>}
                          <Badge variant="secondary">v{doc.version}</Badge>
                          {getStatusBadge(doc.status)}
                        </div>
                      </div>
                      {/* Knapper: Last ned, Slett */}
                      <div className="flex items-center gap-2">
                        {doc.file_name && <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Last ned
                          </Button>}
                        <DeleteDocumentDialog documentId={doc.id} documentTitle={doc.title} filePath={doc.file_path} onDeleted={loadDocuments} />
                      </div>
                    </div>
                  </CardHeader>
                  {/* Opprettelsesdato */}
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Opprettet: {new Date(doc.created_at).toLocaleDateString("nb-NO")}
                    </p>
                  </CardContent>
                </Card>)}
          </div>
        </TabsContent>
      </Tabs>
    </div>;
}