// Hooks fra React
import { useEffect, useState } from "react";
// Supabase-klient
import { supabase } from "@/lib/supabase";
// UI-komponenter
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, CheckCircle2, Clock, XCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Egne hooks og toast
import { useToast } from "@/hooks/use-toast";
// Bekreftelses-dialog
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Modell for en retningslinje
interface Guideline {
  id: string;
  name: string;
  code: string;
  description: string;
  certification_status: string | null;
}

// Modell for en kontroll under en retningslinje
interface Control {
  id: string;
  control_number: string;
  title: string;
  description: string;
  status: "implementert" | "pagaar" | "ikke_startet";
  deadline: string | null;
}

export default function Retningslinjer() {
  // State: retningslinjer, kontroller og UI-tilstand
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [controlsByGuideline, setControlsByGuideline] = useState<Record<string, Control[]>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [currentGuideline, setCurrentGuideline] = useState<string>("");
  const [controlNumber, setControlNumber] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"implementert" | "pagaar" | "ikke_startet">("ikke_startet");
  const [deadline, setDeadline] = useState("");
  // Toast for enkle meldinger
  const { toast } = useToast();

  // Last inn retningslinjer og kontroller ved mount
  useEffect(() => {
    loadData();
  }, []);

  // Hent retningslinjer og kontroller fra databasen
  const loadData = async () => {
    try {
      const { data: guidelinesData } = await supabase
        .from("guidelines")
        .select("*")
        .order("sort_order");

      setGuidelines(guidelinesData || []);

      // Hent kontroller for hver retningslinje og bygg et kart
      const controlsMap: Record<string, Control[]> = {};
      for (const guideline of guidelinesData || []) {
        const { data } = await supabase
          .from("guideline_controls")
          .select("*")
          .eq("guideline_id", guideline.id)
          .order("control_number");
        controlsMap[guideline.id] = data || [];
      }
      setControlsByGuideline(controlsMap);
    } catch (error) {
      console.error("Error loading guidelines:", error);
    } finally {
      setLoading(false);
    }
  };

  // Legg til en ny kontroll for valgt retningslinje
  const handleAddControl = async () => {
    if (!controlNumber || !title || !currentGuideline) {
      toast({
        title: "Feil",
        description: "Vennligst fyll ut kontrollnummer og tittel",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("guideline_controls").insert({
        guideline_id: currentGuideline,
        control_number: controlNumber,
        title,
        description,
        status,
        deadline: deadline || null,
      });

      if (error) throw error;

      toast({
        title: "Kontroll lagt til",
        description: "Kontrollen ble lagret",
      });

      setOpen(false);
      setControlNumber("");
      setTitle("");
      setDescription("");
      setStatus("ikke_startet");
      setDeadline("");
      loadData();
    } catch (error) {
      console.error("Error adding control:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke legge til kontroll",
        variant: "destructive",
      });
    }
  };

  // Slett en kontroll etter id
  const handleDeleteControl = async (controlId: string) => {
    try {
      const { error } = await supabase
        .from("guideline_controls")
        .delete()
        .eq("id", controlId);

      if (error) throw error;

      toast({
        title: "Kontroll slettet",
        description: "Kontrollen ble fjernet",
      });

      loadData();
    } catch (error) {
      console.error("Error deleting control:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke slette kontroll",
        variant: "destructive",
      });
    }
  };

  // Oppdater status for en kontroll (implementert/pågår/ikke startet)
  const handleStatusChange = async (controlId: string, newStatus: "implementert" | "pagaar" | "ikke_startet") => {
    try {
      const { error } = await supabase
        .from("guideline_controls")
        .update({ status: newStatus })
        .eq("id", controlId);

      if (error) throw error;

      toast({
        title: "Status oppdatert",
        description: "Kontrollen ble oppdatert",
      });

      loadData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke oppdatere status",
        variant: "destructive",
      });
    }
  };

  // Hjelpefunksjon: vis en status-badge for kontrollen
  const getStatusBadge = (status: string) => {
    const variants = {
      implementert: { label: "Implementert", variant: "default" as const, icon: CheckCircle2 },
      pagaar: { label: "Pågår", variant: "secondary" as const, icon: Clock },
      ikke_startet: { label: "Ikke startet", variant: "outline" as const, icon: XCircle },
    };

    const config = variants[status as keyof typeof variants];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Komponent: liste over kontroller for en retningslinje
  const ControlsList = ({ controls }: { controls: Control[] }) => (
    <div className="space-y-4">
      {controls.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Ingen kontroller registrert ennå
          </CardContent>
        </Card>
      ) : (
        controls.map((control) => (
          <Card key={control.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{control.control_number}</Badge>
                    <CardTitle className="text-lg">{control.title}</CardTitle>
                  </div>
                  {control.description && (
                    <CardDescription>{control.description}</CardDescription>
                  )}
                  {control.deadline && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Frist: {new Date(control.deadline).toLocaleDateString("nb-NO")}
                    </p>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <Select value={control.status} onValueChange={(value) => handleStatusChange(control.id, value as "implementert" | "pagaar" | "ikke_startet")}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ikke_startet">Ikke startet</SelectItem>
                      <SelectItem value="pagaar">Pågår</SelectItem>
                      <SelectItem value="implementert">Implementert</SelectItem>
                    </SelectContent>
                  </Select>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Slett kontroll</AlertDialogTitle>
                        <AlertDialogDescription>
                          Er du sikker på at du vil slette denne kontrollen? Denne handlingen kan ikke angres.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteControl(control.id)}>
                          Slett
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))
      )}
    </div>
  );

  // Vis loader mens data hentes
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Hoved-UI: vis retningslinjer som faner og kontroller per fane
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Retningslinjer</h1>
        <p className="text-muted-foreground">
          ISO-standarder for kvalitet, AI og informasjonssikkerhet
        </p>
      </div>

      {guidelines.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Ingen retningslinjer funnet
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={guidelines[0]?.id} className="w-full">
          {/* Faner for hver retningslinje */}
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${guidelines.length}, minmax(0, 1fr))` }}>
            {guidelines.map((guideline) => (
              <TabsTrigger key={guideline.id} value={guideline.id} className="gap-2">
                <BookOpen className="h-4 w-4" />
                {guideline.code}
              </TabsTrigger>
            ))}
          </TabsList>

          {guidelines.map((guideline) => (
            <TabsContent key={guideline.id} value={guideline.id} className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Card className="flex-1">
                    <CardHeader>
                      <CardTitle>{guideline.name}</CardTitle>
                      {guideline.description && (
                        <CardDescription>{guideline.description}</CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                  {/* Dialog for å legge til kontroll i denne retningslinjen */}
                  <Dialog open={open && currentGuideline === guideline.id} onOpenChange={(isOpen) => {
                    setOpen(isOpen);
                    if (isOpen) setCurrentGuideline(guideline.id);
                  }}>
                    <DialogTrigger asChild>
                      <Button className="ml-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Legg til kontroll
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Legg til ny kontroll</DialogTitle>
                        <DialogDescription>
                          Registrer en ny kontroll for {guideline.code}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          {/* Kontrollnummer (f.eks. 4.1.1) */}
                          <Label htmlFor="controlNumber">Kontrollnummer *</Label>
                          <Input
                            id="controlNumber"
                            placeholder="F.eks. 4.1.1"
                            value={controlNumber}
                            onChange={(e) => setControlNumber(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          {/* Tittel for kontrollen */}
                          <Label htmlFor="title">Tittel *</Label>
                          <Input
                            id="title"
                            placeholder="Kontrolltittel"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          {/* Beskrivelse (valgfri) */}
                          <Label htmlFor="description">Beskrivelse</Label>
                          <Textarea
                            id="description"
                            placeholder="Beskrivelse av kontrollen"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          {/* Velg status for kontrollen */}
                          <Label htmlFor="status">Status</Label>
                          <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Velg status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ikke_startet">Ikke startet</SelectItem>
                              <SelectItem value="pagaar">Pågår</SelectItem>
                              <SelectItem value="implementert">Implementert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          {/* Frist for gjennomføring (valgfri) */}
                          <Label htmlFor="deadline">Frist</Label>
                          <Input
                            id="deadline"
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                          />
                        </div>
                        <Button onClick={handleAddControl} className="w-full">
                          Lagre kontroll
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                {/* Vis liste over kontroller for valgt retningslinje */}
                <ControlsList controls={controlsByGuideline[guideline.id] || []} />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
