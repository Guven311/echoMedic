import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Clock } from "lucide-react"

interface SessionWarningDialogProps {
  open: boolean
  secondsRemaining: number
  onExtendSession: () => void
}

export function SessionWarningDialog({
  open,
  secondsRemaining,
  onExtendSession,
}: SessionWarningDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Sesjonen utløper snart
          </AlertDialogTitle>
          <AlertDialogDescription>
            Du vil bli automatisk logget ut om{" "}
            <span className="font-semibold text-foreground">
              {secondsRemaining} sekunder
            </span>{" "}
            på grunn av inaktivitet. Klikk på knappen under for å forbli innlogget.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onExtendSession}>
            Forbli innlogget
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
