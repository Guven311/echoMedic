// Hooks fra React
import { useEffect, useState } from "react";
// Supabase klient
import { supabase } from "@/lib/supabase";
// UI-komponenter
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, CheckCircle2, Clock, XCircle, Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Egne hooks
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

// Enkel model for rammeverk
interface Framework {
  id: string;
  name: string;
  description: string;
}

// Modell for krav/kravrad
interface Requirement {
  id: string;
  title: string;
  description: string;
  status: "implementert" | "pagaar" | "ikke_startet";
  deadline: string | null;
}

export default function Rammeverk() {
  // State: data og UI
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [normenReqs, setNormenReqs] = useState<Requirement[]>([]);
  const [gdprReqs, setGdprReqs] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [currentFramework, setCurrentFramework] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"implementert" | "pagaar" | "ikke_startet">("ikke_startet");
  const [deadline, setDeadline] = useState("");
  // Toast for enkle meldinger
  const { toast } = useToast();

  // Last inn rammeverk og krav ved mount
  useEffect(() => {
    loadData();
  }, []);

  // Hent data fra Supabase: rammeverk og krav
  const loadData = async () => {
    try {
      const { data: frameworksData } = await supabase
        .from("frameworks")
        .select("*")
        .order("sort_order");

      // Finn de to standard-rammeverkene vi viser her
      const normen = frameworksData?.find((f) => f.name === "Normen");
      const gdpr = frameworksData?.find((f) => f.name === "GDPR");

      if (normen) {
        const { data: normenData } = await supabase
          .from("framework_requirements")
          .select("*")
          .eq("framework_id", normen.id);
        setNormenReqs(normenData || []);
      }

      if (gdpr) {
        const { data: gdprData } = await supabase
          .from("framework_requirements")
          .select("*")
          .eq("framework_id", gdpr.id);
        setGdprReqs(gdprData || []);
      }

      setFrameworks(frameworksData || []);
    } catch (error) {
      console.error("Error loading frameworks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Legg til nytt krav for valgt rammeverk
  const handleAddRequirement = async () => {
    if (!title || !currentFramework) {
      toast({
        title: "Feil",
        description: "Vennligst fyll ut tittel",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("framework_requirements").insert({
        framework_id: currentFramework,
        title,
        description,
        status,
        deadline: deadline || null,
      });

      if (error) throw error;

      toast({
        title: "Krav lagt til",
        description: "Kravet ble lagret",
      });

      setOpen(false);
      setTitle("");
      setDescription("");
      setStatus("ikke_startet");
      setDeadline("");
      loadData();
    } catch (error) {
      console.error("Error adding requirement:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke legge til krav",
        variant: "destructive",
      });
    }
  };

  // Slett et krav
  const handleDeleteRequirement = async (reqId: string) => {
    try {
      const { error } = await supabase
        .from("framework_requirements")
        .delete()
        .eq("id", reqId);

      if (error) throw error;

      toast({
        title: "Krav slettet",
        description: "Kravet ble fjernet",
      });

      loadData();
    } catch (error) {
      console.error("Error deleting requirement:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke slette krav",
        variant: "destructive",
      });
    }
  };

  // Oppdater status for et krav (implementert/pågår/ikke startet)
  const handleStatusChange = async (reqId: string, newStatus: "implementert" | "pagaar" | "ikke_startet") => {
    try {
      const { error } = await supabase
        .from("framework_requirements")
        .update({ status: newStatus })
        .eq("id", reqId);

      if (error) throw error;

      toast({
        title: "Status oppdatert",
        description: "Kravet ble oppdatert",
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

  // Hjelpefunksjon: vis badge ut fra status
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

  // Liste-komponent for krav (enkelt funksjonelt komponent-mønster)
  const RequirementsList = ({ requirements }: { requirements: Requirement[] }) => (
    <div className="space-y-4">
      {requirements.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Ingen krav registrert ennå
          </CardContent>
        </Card>
      ) : (
        requirements.map((req) => (
          <Card key={req.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg">{req.title}</CardTitle>
                  {req.description && (
                    <CardDescription>{req.description}</CardDescription>
                  )}
                  {req.deadline && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Frist: {new Date(req.deadline).toLocaleDateString("nb-NO")}
                    </p>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <Select value={req.status} onValueChange={(value) => handleStatusChange(req.id, value as "implementert" | "pagaar" | "ikke_startet")}>
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
                        <AlertDialogTitle>Slett krav</AlertDialogTitle>
                        <AlertDialogDescription>
                          Er du sikker på at du vil slette dette kravet? Denne handlingen kan ikke angres.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteRequirement(req.id)}>
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

  // Vis loader mens vi henter data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Hovedvisning: oversikt over rammeverk og krav
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rammeverk</h1>
        <p className="text-muted-foreground">
          Normen og GDPR compliance-oppfølging
        </p>
      </div>

      {/* Faner: velg hvilket rammeverk du ser på */}
      <Tabs defaultValue="normen" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="normen" className="gap-2">
            <FileText className="h-4 w-4" />
            Normen
          </TabsTrigger>
          <TabsTrigger value="gdpr" className="gap-2">
            <FileText className="h-4 w-4" />
            GDPR
          </TabsTrigger>
        </TabsList>

        <TabsContent value="normen" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle>Norm for informasjonssikkerhet</CardTitle>
                  <CardDescription>
                    Krav til informasjonssikkerhet i helse- og omsorgssektoren
                  </CardDescription>
                </CardHeader>
              </Card>
              {/* Dialog: legg til krav for Normen */}
              <Dialog open={open && currentFramework === frameworks.find(f => f.name === "Normen")?.id} onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (isOpen) setCurrentFramework(frameworks.find(f => f.name === "Normen")?.id || "");
              }}>
                <DialogTrigger asChild>
                  <Button className="ml-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Legg til krav
                  </Button>
                </DialogTrigger>
                {/* Skjema for å legge til nytt krav */}
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Legg til nytt krav</DialogTitle>
                    <DialogDescription>
                      Registrer et nytt krav for Normen
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Tittel *</Label>
                      <Input
                        id="title"
                        placeholder="Kravtittel"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Beskrivelse</Label>
                      <Textarea
                        id="description"
                        placeholder="Beskrivelse av kravet"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
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
                      <Label htmlFor="deadline">Frist</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAddRequirement} className="w-full">
                      Lagre krav
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {/* Liste over krav for Normen */}
            <RequirementsList requirements={normenReqs} />
          </div>
        </TabsContent>

        <TabsContent value="gdpr" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle>GDPR - Personvernforordningen</CardTitle>
                  <CardDescription>
                    General Data Protection Regulation (EU 2016/679)
                  </CardDescription>
                </CardHeader>
              </Card>
              {/* Dialog: legg til krav for GDPR */}
              <Dialog open={open && currentFramework === frameworks.find(f => f.name === "GDPR")?.id} onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (isOpen) setCurrentFramework(frameworks.find(f => f.name === "GDPR")?.id || "");
              }}>
                <DialogTrigger asChild>
                  <Button className="ml-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Legg til krav
                  </Button>
                </DialogTrigger>
                {/* Skjema for å legge til nytt krav (GDPR) */}
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Legg til nytt krav</DialogTitle>
                    <DialogDescription>
                      Registrer et nytt krav for GDPR
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Tittel *</Label>
                      <Input
                        id="title"
                        placeholder="Kravtittel"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Beskrivelse</Label>
                      <Textarea
                        id="description"
                        placeholder="Beskrivelse av kravet"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
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
                      <Label htmlFor="deadline">Frist</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAddRequirement} className="w-full">
                      Lagre krav
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {/* Liste over krav for GDPR */}
            <RequirementsList requirements={gdprReqs} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
