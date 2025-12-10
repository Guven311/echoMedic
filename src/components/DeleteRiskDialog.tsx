// Importerer komponenter for dialog og handling
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
// Alert-dialog for sletting
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
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2 } from "lucide-react";

// Interface for props
interface DeleteRiskDialogProps {
  riskId: string;
  riskTitle: string;
  onDeleted: () => void;
}

// Dialog-komponent for å slette risikovurdering
export function DeleteRiskDialog({ riskId, riskTitle, onDeleted }: DeleteRiskDialogProps) {
  // State for dialog og sletting
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  // Sletter risiko fra database
  const handleDelete = async () => {
    setDeleting(true);

    try {
      // Sletter risiko-posten fra database
      const { error } = await supabase
        .from("risk_assessments")
        .delete()
        .eq("id", riskId);

      if (error) {
        console.error("Error deleting risk:", error);
        toast({
          title: "Kunne ikke slette risikovurdering",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Viser suksess-melding
      toast({
        title: "Risikovurdering slettet",
        description: `"${riskTitle}" er permanent fjernet`,
      });

      setOpen(false);
      onDeleted();
    } catch (error) {
      // Logger feil
      console.error("Error deleting risk:", error);
      toast({
        title: "Feil ved sletting",
        description: "En uventet feil oppstod",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  // Returnerer alert-dialog for sletting
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {/* Knapp for å åpne dialog */}
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        {/* Dialog-tittel og beskrivelse */}
        <AlertDialogHeader>
          <AlertDialogTitle>Slett risikovurdering?</AlertDialogTitle>
          <AlertDialogDescription>
            Er du sikker på at du vil slette "{riskTitle}"? Denne handlingen kan ikke angres.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {/* Dialog-handlinger */}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Avbryt</AlertDialogCancel>
          {/* Slett-knapp med loading-tilstand */}
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sletter...
              </>
            ) : (
              "Slett"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
