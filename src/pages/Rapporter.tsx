// React hooks
import { useEffect, useState } from "react";
// Supabase-integrasjon
import { supabase } from "@/lib/supabase";
// UI-komponenter fra shadcn
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Egne hooks
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
// Dialog for bekreftelse
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Interface for revisjonshendelser
interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
  user_id: string | null;
}

// Interface for compliance-rapporter
interface ComplianceReport {
  id: string;
  title: string;
  description: string | null;
  report_date: string;
  status: string;
  created_at: string;
  created_by: string | null;
}
// Rapporter-side for revisjon og compliance
export default function Rapporter() {
  // State for revisjonshendelser og rapporter
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for dialogs og skjema
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [description, setDescription] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportStatus, setReportStatus] = useState("utkast");
  
  // Hooks
  const { toast } = useToast();
  const { user } = useAuth();
  // Last inn data når komponenten monteres
  useEffect(() => {
    loadAuditLogs();
    loadComplianceReports();
  }, []);

  // Hent alle revisjonshendelser fra databasen
  // Henter siste 50 hendelser for å vise i aktivitetsloggen
  const loadAuditLogs = async () => {
    try {
      const {
        data
      } = await supabase.from("audit_logs").select("*").order("created_at", {
        ascending: false
      }).limit(50);
      setAuditLogs(data || []);
    } catch (error) {
      console.error("Error loading audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Hent alle compliance-rapporter fra databasen
  // Viser rapporter i fanen "compliance"
  const loadComplianceReports = async () => {
    try {
      const {
        data
      } = await supabase.from("compliance_reports").select("*").order("created_at", {
        ascending: false
      });
      setComplianceReports(data || []);
    } catch (error) {
      console.error("Error loading compliance reports:", error);
    }
  };
  // Hjelpe-funksjon: gi farget badge basert på handlingstype
  // Viser et lite merke (Opprettet/Endret/Slettet) for hver logg
  const getActionBadge = (action: string) => {
    if (action.includes("create") || action.includes("opprett")) {
      return <Badge className="bg-success">Opprettet</Badge>;
    }
    if (action.includes("update") || action.includes("oppdater")) {
      return <Badge variant="secondary">Oppdatert</Badge>;
    }
    if (action.includes("delete") || action.includes("slett")) {
      return <Badge variant="destructive">Slettet</Badge>;
    }
    return <Badge variant="outline">{action}</Badge>;
  };
  // Hjelpe-funksjon: oversett enhettype til norsk
  // Gjør tekniske navn mer lesbare for brukeren
  const translateEntityType = (type: string) => {
    const translations: Record<string, string> = {
      framework: "Rammeverk",
      guideline: "Retningslinje",
      risk_assessment: "Risikovurdering",
      document: "Dokument",
      template: "Mal"
    };
    return translations[type] || type;
  };
  // Håndter lagring av ny audit-logg
  // Validerer input og skriver ny rad til `audit_logs`
  const handleAddLog = async () => {
    if (!action || !entityType) {
      toast({
        title: "Feil",
        description: "Vennligst fyll ut alle påkrevde felt",
        variant: "destructive"
      });
      return;
    }
    try {
      const {
        error
      } = await supabase.from("audit_logs").insert({
        action,
        entity_type: entityType,
        user_id: user?.id,
        new_values: description ? {
          description
        } : null
      });
      if (error) throw error;
      toast({
        title: "Loggføring lagt til",
        description: "Loggføringen ble lagret"
      });
      setOpen(false);
      setAction("");
      setEntityType("");
      setDescription("");
      loadAuditLogs();
    } catch (error) {
      console.error("Error adding log:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke legge til loggføring",
        variant: "destructive"
      });
    }
  };
  // Håndter sletting av audit-logg
  // Sletter en rad fra `audit_logs` etter id
  const handleDeleteLog = async (logId: string) => {
    try {
      const {
        error
      } = await supabase.from("audit_logs").delete().eq("id", logId);
      if (error) throw error;
      toast({
        title: "Loggføring slettet",
        description: "Loggføringen ble fjernet"
      });
      loadAuditLogs();
    } catch (error) {
      console.error("Error deleting log:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke slette loggføring",
        variant: "destructive"
      });
    }
  };
  // Håndter opprettelse av ny compliance-rapport
  // Enkelt skjema som lagrer metadata om rapporten
  const handleAddReport = async () => {
    if (!reportTitle) {
      toast({
        title: "Feil",
        description: "Vennligst fyll ut tittel",
        variant: "destructive"
      });
      return;
    }
    try {
      const {
        error
      } = await supabase.from("compliance_reports").insert({
        title: reportTitle,
        description: reportDescription,
        status: reportStatus,
        created_by: user?.id
      });
      if (error) throw error;
      toast({
        title: "Rapport opprettet",
        description: "Compliance-rapporten ble lagret"
      });
      setReportOpen(false);
      setReportTitle("");
      setReportDescription("");
      setReportStatus("utkast");
      loadComplianceReports();
    } catch (error) {
      console.error("Error adding report:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke opprette rapport",
        variant: "destructive"
      });
    }
  };
  // Håndter sletting av compliance-rapport
  // Sletter rapporten fra `compliance_reports`
  const handleDeleteReport = async (reportId: string) => {
    try {
      const {
        error
      } = await supabase.from("compliance_reports").delete().eq("id", reportId);
      if (error) throw error;
      toast({
        title: "Rapport slettet",
        description: "Compliance-rapporten ble fjernet"
      });
      loadComplianceReports();
    } catch (error) {
      console.error("Error deleting report:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke slette rapport",
        variant: "destructive"
      });
    }
  };
  // Vis loading-spinner mens data lastes
  if (loading) {
    return <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>;
  }

  // Hovedvisning: Rapporter og audit-logg
  return <div className="space-y-6">
      {/* Sidetittel */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rapporter og Audit</h1>
          <p className="text-muted-foreground">
            EchoMedic-rapporter og aktivitetslogg
          </p>
        </div>
        {/* Dialog for å legge til ny logg */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Legg til logg
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Legg til loggføring</DialogTitle>
              <DialogDescription>
                Registrer en ny aktivitet i systemet
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                {/* Input for handling (kort tekst) */}
                <Label htmlFor="action">Handling *</Label>
                <Input id="action" placeholder="F.eks. Opprettet dokument" value={action} onChange={e => setAction(e.target.value)} />
              </div>
              <div className="space-y-2">
                {/* Velg hvilken type enhet hendelsen gjelder */}
                <Label htmlFor="entityType">Enhetstype *</Label>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="framework">Rammeverk</SelectItem>
                    <SelectItem value="guideline">Retningslinje</SelectItem>
                    <SelectItem value="risk_assessment">Risikovurdering</SelectItem>
                    <SelectItem value="document">Dokument</SelectItem>
                    <SelectItem value="template">Mal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                {/* Valgfri beskrivelse for eventuelle detaljer */}
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea id="description" placeholder="Tilleggsinformasjon om hendelsen" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <Button onClick={handleAddLog} className="w-full">
                Lagre loggføring
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="audit" className="w-full">
        {/* Faner: velg mellom aktivitetslogg og compliance-rapporter */}
        <TabsList>
          <TabsTrigger value="audit">Aktivitetslogg</TabsTrigger>
          <TabsTrigger value="compliance">EchoMedic - rapport</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="mt-6 space-y-4">
          {/* Aktivitetslogg: vis liste over audit-entries */}
          {auditLogs.length === 0 ? <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Ingen aktivitet registrert ennå
              </CardContent>
            </Card> : auditLogs.map(log => <Card key={log.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">
                          {log.action}
                        </CardTitle>
                      </div>
                      <CardDescription>
                        {translateEntityType(log.entity_type)}
                      </CardDescription>
                    </div>
                    <div className="flex items-end gap-3">
                      <div className="flex flex-col items-end gap-2">
                        {getActionBadge(log.action)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString("nb-NO")}
                        </span>
                      </div>
                      {/* Bekreftelse: slett logg */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Slett loggføring</AlertDialogTitle>
                            <AlertDialogDescription>
                              Er du sikker på at du vil slette denne loggføringen? Denne handlingen kan ikke angres.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteLog(log.id)}>
                              Slett
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
              </Card>)}
        </TabsContent>

        <TabsContent value="compliance" className="mt-6 space-y-4">
          <div className="flex justify-end">
            {/* Dialog for å opprette ny compliance-rapport */}
            <Dialog open={reportOpen} onOpenChange={setReportOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ny rapport
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Opprett compliance-rapport</DialogTitle>
                  <DialogDescription>
                    Registrer en ny compliance-rapport
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    {/* Tittel for rapporten */}
                    <Label htmlFor="reportTitle">Tittel *</Label>
                    <Input id="reportTitle" placeholder="Rapporttittel" value={reportTitle} onChange={e => setReportTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    {/* Velg status for rapporten */}
                    <Label htmlFor="reportStatus">Status</Label>
                    <Select value={reportStatus} onValueChange={setReportStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utkast">Utkast</SelectItem>
                        <SelectItem value="under_gjennomgang">Under gjennomgang</SelectItem>
                        <SelectItem value="godkjent">Godkjent</SelectItem>
                        <SelectItem value="arkivert">Arkivert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    {/* Kort beskrivelse av innholdet i rapporten */}
                    <Label htmlFor="reportDescription">Beskrivelse</Label>
                    <Textarea id="reportDescription" placeholder="Detaljer om rapporten" value={reportDescription} onChange={e => setReportDescription(e.target.value)} />
                  </div>
                  <Button onClick={handleAddReport} className="w-full">
                    Opprett rapport
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Rapporter: vis liste eller tom-tilstand */}
          {complianceReports.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Ingen rapporter opprettet ennå
              </CardContent>
            </Card>
          ) : (
            // Mapper over rapportene og viser et kort per rapport
            complianceReports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      {/* Rapport-tittel og eventuell beskrivelse */}
                      <CardTitle className="text-base">{report.title}</CardTitle>
                      {report.description && (
                        <CardDescription>{report.description}</CardDescription>
                      )}
                      <div className="flex items-center gap-2">
                        {/* Status-badge og opprettelsesdato */}
                        <Badge variant="outline">{report.status}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(report.created_at).toLocaleString("nb-NO")}
                        </span>
                      </div>
                    </div>
                    {/* Slett-knapp med bekreftelsesdialog */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Slett rapport</AlertDialogTitle>
                          <AlertDialogDescription>
                            Er du sikker på at du vil slette denne rapporten? Denne handlingen kan ikke angres.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteReport(report.id)}>
                            Slett
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>;
}