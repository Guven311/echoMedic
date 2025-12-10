// Importerer komponenter for dialog og handling
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
// Dialog komponenter
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
interface DeleteDocumentDialogProps {
  documentId: string;
  documentTitle: string;
  filePath: string | null;
  onDeleted: () => void;
}

// Dialog-komponent for å slette dokument
export function DeleteDocumentDialog({
  documentId,
  documentTitle,
  filePath,
  onDeleted,
}: DeleteDocumentDialogProps) {
  // State for dialog og sletting
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  // Sletter dokument og tilhørende fil
  const handleDelete = async () => {
    setDeleting(true);

    try {
      // Sletter fil fra storage hvis den finnes
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from("compliance-documents")
          .remove([filePath]);

        if (storageError) {
          console.error("Error deleting file from storage:", storageError);
          // Fortsetter med dokumentsletting selv om filsletting feiler
        }
      }

      // Sletter dokument-posten fra database
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (error) {
        console.error("Error deleting document:", error);
        toast({
          title: "Kunne ikke slette dokument",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Viser suksess-melding
      toast({
        title: "Dokument slettet",
        description: `"${documentTitle}" er permanent fjernet`,
      });

      setOpen(false);
      onDeleted();
    } catch (error) {
      // Logger feil
      console.error("Error deleting document:", error);
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
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        {/* Dialog-tittel og beskrivelse */}
        <AlertDialogHeader>
          <AlertDialogTitle>Slett dokument?</AlertDialogTitle>
          <AlertDialogDescription>
            Er du sikker på at du vil slette "{documentTitle}"? Denne handlingen
            kan ikke angres og vil fjerne både dokumentet og eventuelle filer fra
            lagringen.
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
