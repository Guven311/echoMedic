// Importerer React-hooks
import { useState, useEffect } from "react"
// Importerer navigasjon fra React Router
import { useNavigate } from "react-router-dom"
// Importerer auth-hook for bruker-data
import { useAuth } from "@/hooks/useAuth"
// Importerer Supabase-klient
import { supabase } from "@/lib/supabase"
// Importerer UI-komponenter
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
// Importerer toast for varsler
import { toast } from "@/hooks/use-toast"
// Importerer ikoner
import { Users, Plus, Trash2, Shield, Loader2 } from "lucide-react"

// Interface for bruker-data fra database
interface UserData {
  id: string
  email: string
  fullName: string
  avatarUrl: string
  role: string
  createdAt: string
  lastSignIn: string
}

// Admin-side: administrer alle brukere i systemet
export default function Admin() {
  const navigate = useNavigate()
  const { user, session, isAdmin } = useAuth()
  // State for bruker-liste
  const [users, setUsers] = useState<UserData[]>([])
  // Loading-state mens vi henter brukere
  const [loading, setLoading] = useState(true)
  // Dialog-states for opprett og slett
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  // Bruker som er valgt for sletting
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  // Loading-states for operasjoner
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Sjekk admin-tilgang når komponenten monteres
  useEffect(() => {
    if (!user) {
      navigate("/auth")
      return
    }

    // Vent på at admin-status er sjekket
    if (!isAdmin) {
      // Gi litt tid for admin-sjekk å fullføre
      const timeout = setTimeout(() => {
        if (!isAdmin) {
          toast({
            title: "Ingen tilgang",
            description: "Du har ikke tilgang til admin-siden.",
            variant: "destructive",
          })
          navigate("/")
        }
      }, 1000)

      return () => clearTimeout(timeout)
    }

    // Admin-sjekk OK - hent alle brukere
    fetchUsers()
  }, [user, isAdmin, navigate])

  // Hent alle brukere fra backend
  const fetchUsers = async () => {
    try {
      // Kall Supabase-funksjon for å liste brukere
      const response = await supabase.functions.invoke("admin-list-users", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      })

      if (response.error || response.data?.error) {
        throw new Error(response.data?.error || "Kunne ikke hente brukere")
      }

      // Oppdater brukerlisten
      setUsers(response.data.users || [])
    } catch (error) {
      toast({
        title: "Feil",
        description:
          error instanceof Error ? error.message : "Kunne ikke hente brukere",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handler: opprett ny bruker
  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCreating(true)

    // Hent form-data
    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const fullName = formData.get("fullName") as string
    const role = formData.get("role") as string

    try {
      // Kall Supabase-funksjon for å opprette bruker
      const response = await supabase.functions.invoke("admin-create-user", {
        body: { email, password, fullName, role },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      })

      if (response.error || response.data?.error) {
        throw new Error(response.data?.error || "Kunne ikke opprette bruker")
      }

      // Vis suksess-melding
      toast({
        title: "Bruker opprettet",
        description: `${email} er nå opprettet.`,
      })

      // Lukk dialog og oppfrisk liste
      setCreateDialogOpen(false)
      fetchUsers()
    } catch (error) {
      toast({
        title: "Feil",
        description:
          error instanceof Error ? error.message : "Kunne ikke opprette bruker",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  // Handler: slett bruker
  const handleDeleteUser = async () => {
    if (!selectedUser) return
    setDeleting(true)

    try {
      // Kall Supabase-funksjon for å slette bruker
      const response = await supabase.functions.invoke("admin-delete-user", {
        body: { userId: selectedUser.id },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      })

      if (response.error || response.data?.error) {
        throw new Error(response.data?.error || "Kunne ikke slette bruker")
      }

      // Vis suksess-melding
      toast({
        title: "Bruker slettet",
        description: `${selectedUser.email} er nå slettet.`,
      })

      // Lukk dialog og oppfrisk liste
      setDeleteDialogOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error) {
      toast({
        title: "Feil",
        description:
          error instanceof Error ? error.message : "Kunne ikke slette bruker",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  // Returnerer riktig farggiving for rolle-badge
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive" // Rød for admin
      case "revisor":
        return "secondary" // Grå for revisor
      default:
        return "outline" // Standard for bruker
    }
  }

  // Vis loading-spinner mens data hentes
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Render admin-side
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Administrasjon</h1>
            <p className="text-muted-foreground">
              Administrer brukere og tilganger
            </p>
          </div>
        </div>
      </div>

      {/* Brukere-tabell */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Brukere
            </CardTitle>
            <CardDescription>
              {users.length} {users.length === 1 ? "bruker" : "brukere"}{" "}
              registrert
            </CardDescription>
          </div>
          {/* Dialog for å opprette ny bruker */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Ny bruker
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Opprett ny bruker</DialogTitle>
                <DialogDescription>
                  Fyll inn informasjon for den nye brukeren.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Fullt navn</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Ola Nordmann"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-post</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="ola@firma.no"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Passord</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 8 tegn
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rolle</Label>
                  <Select name="role" defaultValue="bruker">
                    <SelectTrigger>
                      <SelectValue placeholder="Velg rolle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bruker">Bruker</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Avbryt
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? "Oppretter..." : "Opprett bruker"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {/* Tabell med alle brukere */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Navn</TableHead>
                <TableHead>E-post</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Opprettet</TableHead>
                <TableHead>Sist innlogget</TableHead>
                <TableHead className="text-right">Handlinger</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* For hver bruker: vis data i tabell-rad */}
              {users.map((userData) => (
                <TableRow key={userData.id}>
                  <TableCell className="font-medium">
                    {userData.fullName || "-"}
                  </TableCell>
                  <TableCell>{userData.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(userData.role)}>
                      {userData.role === "admin"
                        ? "Administrator"
                        : userData.role === "revisor"
                        ? "Revisor"
                        : "Bruker"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {userData.createdAt
                      ? new Date(userData.createdAt).toLocaleDateString("nb-NO")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {userData.lastSignIn
                      ? new Date(userData.lastSignIn).toLocaleDateString(
                          "nb-NO"
                        )
                      : "Aldri"}
                  </TableCell>
                  {/* Slett-knapp (ikke tilgjengelig for egen bruker) */}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setSelectedUser(userData)
                        setDeleteDialogOpen(true)
                      }}
                      disabled={userData.id === user?.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bekreftels-dialog for sletting */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slett bruker</DialogTitle>
            <DialogDescription>
              Er du sikker på at du vil slette {selectedUser?.email}? Denne
              handlingen kan ikke angres.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Avbryt
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleting}
            >
              {deleting ? "Sletter..." : "Slett bruker"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
