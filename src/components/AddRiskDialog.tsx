import { useState } from "react";
import { supabase } from "@/lib/supabase";
// UI komponenter fra shadcn
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2 } from "lucide-react";
import { z } from "zod";
import { RiskMatrix } from "@/components/RiskMatrix";

// Validering for risiko-skjema
const riskSchema = z.object({
  title: z.string().trim().min(1, "Tittel er påkrevd").max(200, "Tittel må være under 200 tegn"),
  description: z.string().trim().max(1000, "Beskrivelse må være under 1000 tegn").optional(),
  category: z.string().trim().max(100, "Kategori må være under 100 tegn").optional(),
  probability: z.enum(["lav", "middels", "hoy", "kritisk"], {
    required_error: "Sannsynlighet er påkrevd",
  }),
  consequence: z.enum(["lav", "middels", "hoy", "kritisk"], {
    required_error: "Konsekvens er påkrevd",
  }),
  treatment: z.enum(["aksepter", "reduser", "overfor", "unngaa"], {
    required_error: "Behandling er påkrevd",
  }),
  mitigation_plan: z.string().trim().max(2000, "Tiltaksplan må være under 2000 tegn").optional(),
});

type RiskFormData = z.infer<typeof riskSchema>;

// Props for komponenten
interface AddRiskDialogProps {
  onRiskAdded: () => void;
}

// Dialog for å legge til ny risiko
export function AddRiskDialog({ onRiskAdded }: AddRiskDialogProps) {
  // State for dialog og form
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<RiskFormData>>({
    title: "",
    description: "",
    category: "",
    probability: undefined,
    consequence: undefined,
    treatment: undefined,
    mitigation_plan: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RiskFormData, string>>>({});
  const { toast } = useToast();

  // Beregn risikoscore ut fra sannsynlighet og konsekvens
  const calculateRiskScore = (
    probability: string,
    consequence: string
  ): number => {
    const levelValues: Record<string, number> = {
      lav: 1,
      middels: 2,
      hoy: 3,
      kritisk: 4,
    };
    return levelValues[probability] * levelValues[consequence];
  };

  // Håndter innsending av skjema
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Valider skjemadata
      const validatedData = riskSchema.parse(formData);

      setLoading(true);

      // Hent nåværende bruker
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Ikke autentisert",
          description: "Du må være logget inn for å opprette risikovurderinger",
          variant: "destructive",
        });
        return;
      }

      // Beregn risikoscore for visning
      const riskScore = calculateRiskScore(
        validatedData.probability,
        validatedData.consequence
      );

      // Lagre risiko i database (risikoscore beregnes automatisk)
      const { error } = await supabase.from("risk_assessments").insert({
        title: validatedData.title,
        description: validatedData.description || null,
        category: validatedData.category || null,
        probability: validatedData.probability,
        consequence: validatedData.consequence,
        treatment: validatedData.treatment,
        mitigation_plan: validatedData.mitigation_plan || null,
        responsible_user_id: user.id,
        status: "ikke_startet",
      });

      if (error) {
        console.error("Error creating risk:", error);
        toast({
          title: "Kunne ikke opprette risikovurdering",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Risikovurdering opprettet",
        description: `Beregnet risikoscore: ${riskScore} (${getRiskLabel(riskScore)})`,
      });

      // Tilbakestill skjema og lukk dialog
      setFormData({
        title: "",
        description: "",
        category: "",
        probability: undefined,
        consequence: undefined,
        treatment: undefined,
        mitigation_plan: "",
      });
      setOpen(false);
      onRiskAdded();
    } catch (error) {
      // Håndter validerings-feil
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof RiskFormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof RiskFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  // Konverterer risikoscore til tekstlig etikett
  const getRiskLabel = (score: number) => {
    if (score >= 12) return "Kritisk";
    if (score >= 8) return "Høy";
    if (score >= 4) return "Middels";
    return "Lav";
  };

  // Returnerer dialog-komponent for å opprette ny risikovurdering
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Knapp for å åpne dialog */}
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Ny risikovurdering
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Tittel og beskrivelse på dialog */}
        <DialogHeader>
          <DialogTitle>Opprett ny risikovurdering</DialogTitle>
          <DialogDescription>
            Identifiser og vurder en ny risiko for organisasjonen
          </DialogDescription>
        </DialogHeader>
        {/* Skjema for å legge inn risikodata */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tittel-felt */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Tittel <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Beskriv risikoen kort..."
              maxLength={200}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Beskrivelse-felt */}
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Detaljert beskrivelse av risikoen..."
              rows={3}
              maxLength={1000}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Kategori-felt */}
          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              placeholder="F.eks. Datahåndtering, Sikkerhet, Prosess..."
              maxLength={100}
            />
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category}</p>
            )}
          </div>

          {/* Risikomatrise for sannsynlighet og konsekvens */}
          <div className="space-y-2">
            <Label>
              Sannsynlighet og konsekvens <span className="text-destructive">*</span>
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Klikk på en celle i matrisen for å velge sannsynlighet og konsekvens
            </p>
            <RiskMatrix
              probability={formData.probability}
              consequence={formData.consequence}
              onSelect={(probability, consequence) =>
                setFormData({
                  ...formData,
                  probability: probability as RiskFormData["probability"],
                  consequence: consequence as RiskFormData["consequence"],
                })
              }
            />
            {(errors.probability || errors.consequence) && (
              <p className="text-sm text-destructive">
                {errors.probability || errors.consequence}
              </p>
            )}
          </div>

          {/* Risikobehandlings-strategi */}
          <div className="space-y-2">
            <Label htmlFor="treatment">
              Risikobehandling <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.treatment}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  treatment: value as RiskFormData["treatment"],
                })
              }
            >
              <SelectTrigger id="treatment">
                <SelectValue placeholder="Velg behandlingsstrategi..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aksepter">Aksepter - Godta risikoen</SelectItem>
                <SelectItem value="reduser">Reduser - Iverksett tiltak</SelectItem>
                <SelectItem value="overfor">Overfør - Forsikring/outsourcing</SelectItem>
                <SelectItem value="unngaa">Unngå - Avslutt aktivitet</SelectItem>
              </SelectContent>
            </Select>
            {errors.treatment && (
              <p className="text-sm text-destructive">{errors.treatment}</p>
            )}
          </div>

          {/* Tiltaksplan-felt */}
          <div className="space-y-2">
            <Label htmlFor="mitigation_plan">Tiltaksplan</Label>
            <Textarea
              id="mitigation_plan"
              value={formData.mitigation_plan}
              onChange={(e) =>
                setFormData({ ...formData, mitigation_plan: e.target.value })
              }
              placeholder="Beskriv konkrete tiltak for å håndtere risikoen..."
              rows={4}
              maxLength={2000}
            />
            {errors.mitigation_plan && (
              <p className="text-sm text-destructive">
                {errors.mitigation_plan}
              </p>
            )}
          </div>

          {/* Viser beregnet risikoscore hvis begge verdier er valgt */}
          {formData.probability && formData.consequence && (
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm font-medium">
                Beregnet risikoscore:{" "}
                {calculateRiskScore(formData.probability, formData.consequence)}{" "}
                (
                {getRiskLabel(
                  calculateRiskScore(formData.probability, formData.consequence)
                )}
                )
              </p>
            </div>
          )}

          {/* Handlinger - avbryt eller opprett */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Avbryt
            </Button>
            {/* Send-knapp med loading-tilstand */}
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Oppretter...
                </>
              ) : (
                "Opprett risikovurdering"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
