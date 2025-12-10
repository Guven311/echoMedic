import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  CheckSquare,
  FileText,
  Download,
  X,
  Upload,
  Trash2,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
interface Template {
  id: string
  name: string
  description: string | null
  type: string
  content: any
}
interface UploadedFile {
  id: string
  name: string
  path: string
  size: number
  uploaded_at: string
}
export default function Verktoy() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChecklist, setSelectedChecklist] = useState<string | null>(
    null
  )
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  useEffect(() => {
    loadTemplates()
    loadUploadedFiles()
  }, [])
  const loadTemplates = async () => {
    try {
      const { data } = await supabase
        .from("templates")
        .select("*")
        .order("name")
      setTemplates(data || [])
    } catch (error) {
      console.error("Error loading templates:", error)
    } finally {
      setLoading(false)
    }
  }
  const loadUploadedFiles = async () => {
    try {
      const { data: files } = await supabase.storage
        .from("compliance-documents")
        .list(`${user?.id}/verktoy`)
      if (files) {
        const formattedFiles: UploadedFile[] = files.map((file) => ({
          id: file.id,
          name: file.name,
          path: `${user?.id}/verktoy/${file.name}`,
          size: file.metadata?.size || 0,
          uploaded_at: file.created_at,
        }))
        setUploadedFiles(formattedFiles)
      }
    } catch (error) {
      console.error("Error loading files:", error)
    }
  }
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files || files.length === 0 || !user) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const timestamp = Date.now()
        const filePath = `${user.id}/verktoy/${timestamp}-${file.name}`
        const { error } = await supabase.storage
          .from("compliance-documents")
          .upload(filePath, file, { upsert: false })
        if (error) throw error
      }
      toast({
        title: "Filer lastet opp",
        description: `${files.length} fil(er) ble lastet opp.`,
      })
      await loadUploadedFiles()
      event.target.value = ""
    } catch (error) {
      console.error("Error uploading files:", error)
      toast({
        title: "Feil ved opplasting",
        description: "Kunne ikke laste opp filer.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }
  const handleDownloadFile = async (file: UploadedFile) => {
    try {
      const { data, error } = await supabase.storage
        .from("compliance-documents")
        .download(file.path)
      if (error) throw error
      const url = URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading file:", error)
      toast({
        title: "Feil ved nedlasting",
        description: "Kunne ikke laste ned fil.",
        variant: "destructive",
      })
    }
  }
  const handleDeleteFile = async (file: UploadedFile) => {
    try {
      const { error } = await supabase.storage
        .from("compliance-documents")
        .remove([file.path])
      if (error) throw error
      toast({
        title: "Fil slettet",
        description: "Filen ble slettet.",
      })
      await loadUploadedFiles()
    } catch (error) {
      console.error("Error deleting file:", error)
      toast({
        title: "Feil ved sletting",
        description: "Kunne ikke slette fil.",
        variant: "destructive",
      })
    }
  }
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sjekkliste: "Sjekkliste",
      mal: "Mal",
      rapport: "Rapport",
    }
    return labels[type] || type
  }
  const getChecklistContent = (type: string) => {
    const checklists: Record<
      string,
      {
        sections: {
          title: string
          items: string[]
        }[]
      }
    > = {
      "ISO 13485": {
        sections: [
          {
            title: "4. Kvalitetsstyringssystem",
            items: [
              "4.1 Generelle krav - Etablert og dokumentert kvalitetsstyringssystem",
              "4.2 Dokumentasjonskrav - Kvalitetshåndbok og dokumenterte prosedyrer",
              "4.2.4 Kontroll av dokumenter - Prosedyre for dokumentstyring",
              "4.2.5 Kontroll av registreringer - Identifikasjon, lagring og beskyttelse",
            ],
          },
          {
            title: "5. Ledelsens ansvar",
            items: [
              "5.1 Ledelsens forpliktelse - Politikk og mål for kvalitet",
              "5.3 Kvalitetspolitikk - Dokumentert og kommunisert",
              "5.4 Planlegging - Kvalitetsmål og kvalitetsplanlegging",
              "5.5 Ansvar og myndighet - Definerte roller og ansvar",
              "5.6 Ledelsens gjennomgang - Regelmessige gjennomganger",
            ],
          },
          {
            title: "6. Ressursstyring",
            items: [
              "6.1 Tilførsel av ressurser - Tilstrekkelige ressurser",
              "6.2 Personell - Kompetanse, bevissthet og opplæring",
              "6.3 Infrastruktur - Bygninger, arbeidsmiljø og støtteutstyr",
              "6.4 Arbeidsmiljø - Kontroll av arbeidsmiljøet",
            ],
          },
          {
            title: "7. Produktrealisering",
            items: [
              "7.1 Planlegging av produktrealisering",
              "7.2 Kunderelaterte prosesser - Krav og kommunikasjon",
              "7.3 Design og utvikling - Planlegging, input, output, verifikasjon",
              "7.5 Produksjon og tjenesteleveranse - Kontrollerte forhold",
              "7.6 Kontroll av måle- og overvåkingsutstyr",
            ],
          },
        ],
      },
      "ISO 42001": {
        sections: [
          {
            title: "4. Organisasjonskontekst",
            items: [
              "4.1 Forstå organisasjonen og konteksten",
              "4.2 Forstå interessenters behov og forventninger",
              "4.3 Fastsette omfanget av AI-styringssystemet",
              "4.4 AI-styringssystem - etablering og vedlikehold",
            ],
          },
          {
            title: "5. Lederskap",
            items: [
              "5.1 Ledelse og forpliktelse til AI-styring",
              "5.2 AI-politikk - etablert og kommunisert",
              "5.3 Roller, ansvar og myndighet for AI-systemer",
            ],
          },
          {
            title: "6. Planlegging",
            items: [
              "6.1 Handlinger for å håndtere risikoer og muligheter",
              "6.2 AI-mål og planlegging for å oppnå dem",
              "6.3 Planlegging av endringer i AI-systemet",
            ],
          },
          {
            title: "7. Støtte",
            items: [
              "7.1 Ressurser for AI-drift",
              "7.2 Kompetanse - AI-spesifikk kunnskap",
              "7.3 Bevissthet om AI-risikoer og etikk",
              "7.4 Kommunikasjon om AI-systemer",
              "7.5 Dokumentert informasjon - AI-dokumentasjon",
            ],
          },
          {
            title: "8. Drift",
            items: [
              "8.1 Operasjonell planlegging og kontroll av AI",
              "8.2 AI-livssyklusstyring - design til avvikling",
              "8.3 Datahåndtering og kvalitet",
              "8.4 Menneskelig tilsyn av AI-systemer",
            ],
          },
        ],
      },
      "ISO 27001": {
        sections: [
          {
            title: "4. Kontekst for organisasjonen",
            items: [
              "4.1 Forstå organisasjonen og konteksten",
              "4.2 Forstå interessenters behov og forventninger",
              "4.3 Fastsette omfanget av ISMS",
              "4.4 Informasjonssikkerhetsstyringssystem",
            ],
          },
          {
            title: "5. Lederskap",
            items: [
              "5.1 Ledelse og forpliktelse",
              "5.2 Politikk for informasjonssikkerhet",
              "5.3 Roller, ansvar og myndighet i organisasjonen",
            ],
          },
          {
            title: "6. Planlegging",
            items: [
              "6.1 Handlinger for å håndtere risikoer og muligheter",
              "6.1.2 Informasjonssikkerhetsrisikovurdering",
              "6.1.3 Informasjonssikkerhetsrisikobehandling",
              "6.2 Informasjonssikkerhetsmål og planlegging",
            ],
          },
          {
            title: "7. Støtte",
            items: [
              "7.1 Ressurser for informasjonssikkerhet",
              "7.2 Kompetanse innen sikkerhet",
              "7.3 Bevissthet om sikkerhetstrusler",
              "7.4 Kommunikasjon om sikkerhet",
              "7.5 Dokumentert informasjon",
            ],
          },
          {
            title: "A. Sikkerhetskontroller (Annex A)",
            items: [
              "A.5 Organisatoriske kontroller",
              "A.6 Personkontroller",
              "A.7 Fysiske kontroller",
              "A.8 Teknologiske kontroller",
            ],
          },
        ],
      },
      GDPR: {
        sections: [
          {
            title: "Artikkel 5 - Grunnleggende prinsipper",
            items: [
              "Lovlighet, rettferdighet og åpenhet",
              "Formålsbegrensning - spesifikke formål",
              "Dataminimering - bare nødvendige data",
              "Riktighet - korrekte og oppdaterte data",
              "Lagringsbegrensning - tidsavgrenset lagring",
              "Integritet og konfidensialitet",
            ],
          },
          {
            title: "Artikkel 6 - Lovlig behandlingsgrunnlag",
            items: [
              "Samtykke fra den registrerte",
              "Oppfyllelse av kontrakt",
              "Rettslig forpliktelse",
              "Beskyttelse av vitale interesser",
              "Offentlig interesse eller myndighetsutøvelse",
              "Berettiget interesse",
            ],
          },
          {
            title: "Artikkel 13-14 - Informasjonsplikt",
            items: [
              "Behandlingsansvarlig identitet og kontaktinfo",
              "Formål med behandlingen",
              "Behandlingsgrunnlag",
              "Mottakere eller kategorier av mottakere",
              "Lagringstid",
              "Registrertes rettigheter",
            ],
          },
          {
            title: "Artikkel 15-22 - Registrertes rettigheter",
            items: [
              "Rett til innsyn (Art. 15)",
              "Rett til retting (Art. 16)",
              "Rett til sletting (Art. 17)",
              "Rett til begrensning (Art. 18)",
              "Rett til dataportabilitet (Art. 20)",
              "Rett til å protestere (Art. 21)",
            ],
          },
          {
            title: "Artikkel 32-34 - Sikkerhet og brudd",
            items: [
              "Art. 32 - Sikkerhet i behandlingen",
              "Art. 33 - Melding til tilsynsmyndighet ved brudd",
              "Art. 34 - Informasjon til registrerte ved brudd",
            ],
          },
        ],
      },
      Normen: {
        sections: [
          {
            title: "1. Organisering og styring",
            items: [
              "1.1 Ledelsesforankring av informasjonssikkerhet",
              "1.2 Roller og ansvar for sikkerhet",
              "1.3 Styringssystem for informasjonssikkerhet",
              "1.4 Risikovurdering og risikobehandling",
            ],
          },
          {
            title: "2. Tilgangskontroll",
            items: [
              "2.1 Brukeradministrasjon og identitetsstyring",
              "2.2 Autentisering - sterke autentiseringsmetoder",
              "2.3 Autorisasjon - rollebasert tilgangskontroll",
              "2.4 Logging og overvåking av tilgang",
            ],
          },
          {
            title: "3. Kryptografi",
            items: [
              "3.1 Kryptering av data i ro",
              "3.2 Kryptering av data under overføring",
              "3.3 Nøkkelhåndtering og sertifikatstyring",
              "3.4 Kryptografiske standarder",
            ],
          },
          {
            title: "4. Nettverk og kommunikasjonssikkerhet",
            items: [
              "4.1 Nettverkssegmentering",
              "4.2 Brannmur og inntrenging deteksjon",
              "4.3 VPN for ekstern tilgang",
              "4.4 Sikker e-postkommunikasjon",
            ],
          },
          {
            title: "5. Logging og hendelseshåndtering",
            items: [
              "5.1 Sentral logging av sikkerhetshendelser",
              "5.2 Overvåking og varsling",
              "5.3 Hendelseshåndtering og respons",
              "5.4 Analyse og rapportering av hendelser",
            ],
          },
        ],
      },
    }
    return checklists[type]
  }
  const getTemplateContent = (type: string) => {
    const templates: Record<
      string,
      {
        description: string
        sections: {
          title: string
          content: string
        }[]
      }
    > = {
      Risikovurdering: {
        description:
          "Strukturert mal for systematisk identifisering og vurdering av risikoer",
        sections: [
          {
            title: "1. Risikoidentifikasjon",
            content:
              "Beskriv risikoen: Hva kan gå galt?\nÅrsaker: Hva kan utløse risikoen?\nKonsekvenser: Hva skjer hvis risikoen inntreffer?",
          },
          {
            title: "2. Risikovurdering",
            content:
              "Sannsynlighet: Lav / Middels / Høy / Kritisk\nKonsekvens: Lav / Middels / Høy / Kritisk\nRisikonivå: Beregnes automatisk (Sannsynlighet × Konsekvens)",
          },
          {
            title: "3. Risikobehandling",
            content:
              "Strategi: Aksepter / Reduser / Overfør / Unngå\nTiltak: Konkrete tiltak for å redusere risiko\nAnsvarlig: Hvem er ansvarlig for tiltakene?\nFrist: Når skal tiltakene være implementert?",
          },
          {
            title: "4. Restrisiko",
            content:
              "Vurder restrisiko etter implementerte tiltak\nDokumenter aksept av restrisiko hvis relevant",
          },
        ],
      },
      "Gap-analyse": {
        description:
          "Mal for å identifisere gap mellom nåværende tilstand og ønsket/påkrevd tilstand",
        sections: [
          {
            title: "1. Scope og formål",
            content:
              "Definér hvilken standard/rammeverk det analyseres mot\nBeskriv formålet med gap-analysen\nAvgrens scope for analysen",
          },
          {
            title: "2. Nåværende tilstand (As-Is)",
            content:
              "Dokumentér dagens prosesser og kontroller\nIdentifisér eksisterende dokumentasjon\nKartlegg implementerte tiltak",
          },
          {
            title: "3. Ønsket tilstand (To-Be)",
            content:
              "Beskriv kravene fra standard/rammeverk\nDefiner hva som må være på plass\nSpesifiser målsetninger",
          },
          {
            title: "4. Gap-analyse",
            content:
              "Identifisér gap mellom As-Is og To-Be\nVurder alvorlighetsgrad av hvert gap\nPriorité gap basert på risiko og ressurser",
          },
          {
            title: "5. Handlingsplan",
            content:
              "Definer tiltak for å lukke gap\nTildel ansvar for hvert tiltak\nSett frister og milepæler\nEstimér ressursbehov",
          },
        ],
      },
      Retningslinje: {
        description:
          "Standard mal for utarbeidelse av interne retningslinjer og prosedyrer",
        sections: [
          {
            title: "1. Dokumentinformasjon",
            content:
              "Tittel:\nDokumentnummer:\nVersjon:\nDato:\nGodkjent av:\nNeste revisjon:",
          },
          {
            title: "2. Formål og omfang",
            content:
              "Formål: Hvorfor har vi denne retningslinjen?\nOmfang: Hvem/hva gjelder retningslinjen for?\nDefinisjoner: Viktige begreper",
          },
          {
            title: "3. Roller og ansvar",
            content:
              "Definer hvem som har ansvar for hva\nBeskriv roller involvert i prosessen\nSpesifiser eskaleringsveier",
          },
          {
            title: "4. Retningslinjer og prosedyrer",
            content:
              "Detaljerte prosedyrer steg-for-steg\nViktige kontrollpunkter\nKrav til dokumentasjon",
          },
          {
            title: "5. Referanser og vedlegg",
            content:
              "Relaterte dokumenter og retningslinjer\nRelevante standarder og lovverk\nSkjemaer og maler som vedlegg",
          },
        ],
      },
      Revisjonsrapport: {
        description: "Mal for dokumentasjon av interne og eksterne revisjoner",
        sections: [
          {
            title: "1. Revisjonsinformasjon",
            content:
              "Revisjonstype: Intern / Ekstern / Leverandør\nDato(er) for revisjon:\nRevisjonsteam:\nRevidert område/prosess:\nStandard/rammeverk:",
          },
          {
            title: "2. Formål og omfang",
            content:
              "Formål med revisjonen\nOmfang - hva ble dekket\nEkskluderinger hvis relevante",
          },
          {
            title: "3. Metode",
            content:
              "Dokumentgjennomgang\nIntervjuer - hvem ble intervjuet\nObservasjoner på stedet\nStikkprøvekontroller",
          },
          {
            title: "4. Funn",
            content:
              "Major avvik: Alvorlige brudd på krav\nMinor avvik: Mindre avvik fra krav\nObservasjoner: Forbedringsmuligheter\nPositive funn: Sterke sider",
          },
          {
            title: "5. Konklusjon og anbefalinger",
            content:
              "Samlet vurdering\nAnbefalte korrigerende tiltak\nFrist for tiltak\nOppfølging og verifisering",
          },
        ],
      },
    }
    return templates[type]
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Verktøy og Maler</h1>
        <p className="text-muted-foreground">
          Sjekklister, maler og verktøy for EchoMedic - arbeid
        </p>
      </div>

      <Tabs defaultValue="sjekklister" className="w-full">
        <TabsList>
          <TabsTrigger value="sjekklister">Sjekklister</TabsTrigger>
          <TabsTrigger value="maler">Dokumentmaler</TabsTrigger>
          <TabsTrigger value="lagrede">Lagrede Maler</TabsTrigger>
        </TabsList>

        <TabsContent value="sjekklister" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription>
                  Last opp dine egne sjekklister eller bruk de forhåndsdefinerte
                </CardDescription>
                <div>
                  <Input
                    type="file"
                    id="checklist-upload"
                    className="hidden"
                    multiple
                    accept=".pdf,.docx,.xlsx,.csv"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document.getElementById("checklist-upload")?.click()
                    }
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Laster opp..." : "Last opp sjekkliste"}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card
              className="cursor-pointer hover:border-primary"
              onClick={() => setSelectedChecklist("ISO 13485")}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    ISO 13485 Sjekkliste
                  </CardTitle>
                </div>
                <CardDescription>
                  Kvalitetsstyring for medisinsk utstyr
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary"
              onClick={() => setSelectedChecklist("ISO 42001")}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    ISO 42001 Sjekkliste
                  </CardTitle>
                </div>
                <CardDescription>AI-styringssystemer (AISMS)</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary"
              onClick={() => setSelectedChecklist("ISO 27001")}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    ISO 27001 Sjekkliste
                  </CardTitle>
                </div>
                <CardDescription>Informasjonssikkerhet (ISMS)</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary"
              onClick={() => setSelectedChecklist("GDPR")}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    GDPR Compliance Sjekkliste
                  </CardTitle>
                </div>
                <CardDescription>Personvernforordningen</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary"
              onClick={() => setSelectedChecklist("Normen")}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Normen Sjekkliste</CardTitle>
                </div>
                <CardDescription>Norsk helsedata-standard</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {selectedChecklist && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">
                      {selectedChecklist} Sjekkliste
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Kryss av elementer etter hvert som de er implementert
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedChecklist(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {getChecklistContent(selectedChecklist)?.sections.map(
                  (section, idx) => (
                    <div key={idx} className="space-y-4">
                      <h3 className="font-semibold text-lg">{section.title}</h3>
                      <div className="space-y-3 pl-2">
                        {section.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex items-start gap-3">
                            <Checkbox
                              id={`${idx}-${itemIdx}`}
                              className="mt-1"
                            />
                            <label
                              htmlFor={`${idx}-${itemIdx}`}
                              className="text-sm leading-relaxed cursor-pointer"
                            >
                              {item}
                            </label>
                          </div>
                        ))}
                      </div>
                      {idx <
                        getChecklistContent(selectedChecklist)!.sections
                          .length -
                          1 && <Separator className="mt-4" />}
                    </div>
                  )
                )}
                <div className="flex gap-2 pt-4">
                  <Button onClick={() => setSelectedChecklist(null)}>
                    Lukk
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="maler" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription>
                  Last opp dine egne dokumentmaler eller bruk de
                  forhåndsdefinerte
                </CardDescription>
                <div>
                  <Input
                    type="file"
                    id="template-upload"
                    className="hidden"
                    multiple
                    accept=".pdf,.docx,.xlsx,.pptx"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document.getElementById("template-upload")?.click()
                    }
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Laster opp..." : "Last opp mal"}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card
              className="cursor-pointer hover:border-primary"
              onClick={() => setSelectedTemplate("Risikovurdering")}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Risikovurderingsmal</CardTitle>
                </div>
                <CardDescription>
                  Strukturert mal for risikoanalyse
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary"
              onClick={() => setSelectedTemplate("Gap-analyse")}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Gap-analyse mal</CardTitle>
                </div>
                <CardDescription>
                  Identifiser avvik fra standarder
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary"
              onClick={() => setSelectedTemplate("Retningslinje")}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Retningslinje mal</CardTitle>
                </div>
                <CardDescription>
                  Standard format for retningslinjer
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary"
              onClick={() => setSelectedTemplate("Revisjonsrapport")}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    Revisjonsrapport mal
                  </CardTitle>
                </div>
                <CardDescription>Dokumentasjon av revisjoner</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {selectedTemplate && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">
                      {selectedTemplate}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {getTemplateContent(selectedTemplate)?.description}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedTemplate(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {getTemplateContent(selectedTemplate)?.sections.map(
                  (section, idx) => (
                    <div key={idx} className="space-y-3">
                      <h3 className="font-semibold text-lg text-primary">
                        {section.title}
                      </h3>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm whitespace-pre-line leading-relaxed">
                          {section.content}
                        </p>
                      </div>
                      {idx <
                        getTemplateContent(selectedTemplate)!.sections.length -
                          1 && <Separator className="mt-4" />}
                    </div>
                  )
                )}
                <div className="flex gap-2 pt-4">
                  <Button onClick={() => setSelectedTemplate(null)}>
                    Lukk
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="lagrede" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Opplastede Filer</CardTitle>
                  <CardDescription>
                    Last opp og håndter dine egne maler og dokumenter
                  </CardDescription>
                </div>
                <div>
                  <Input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    multiple
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <Button
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Laster opp..." : "Last opp fil"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {uploadedFiles.length > 0 ? (
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB ·{" "}
                            {new Date(file.uploaded_at).toLocaleDateString(
                              "nb-NO"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadFile(file)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Last ned
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteFile(file)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Ingen filer lastet opp ennå. Last opp dine egne maler og
                  dokumenter.
                </div>
              )}
            </CardContent>
          </Card>

          {templates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Lagrede Maler fra Database</CardTitle>
                <CardDescription>
                  Egendefinerte maler lagret i systemet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-start justify-between gap-4 p-4 border rounded-lg"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <p className="text-sm text-muted-foreground">
                            {template.description}
                          </p>
                        )}
                        <Badge variant="secondary">
                          {getTypeLabel(template.type)}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Eksporter
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
