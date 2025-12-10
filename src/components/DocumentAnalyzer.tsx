// Importerer hooks og UI-komponenter
import { useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
// UI komponenter fra shadcn
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Upload, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Props for komponenten
interface DocumentAnalyzerProps {
  guidelines: Array<{ id: string; code: string; name: string }>
}

// Struktur for analyse-resultat fra AI
interface AnalysisResult {
  score: number
  summary: string
  controls: Array<{
    number: string
    title: string
    status: string
    reason: string
    suggestions?: string
  }>
}

// Hovedkomponent for dokumentanalyse
export function DocumentAnalyzer({ guidelines }: DocumentAnalyzerProps) {
  // State for fil, standard og resultater
  const [file, setFile] = useState<File | null>(null)
  const [guideline, setGuideline] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Håndterer filvalg fra bruker
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      // Sjekker at filen ikke er større enn 50MB
      if (f.size > 52428800) {
        toast({
          title: "File too large",
          description: "Max 50MB",
          variant: "destructive",
        })
        return
      }
      setFile(f)
      setResult(null)
    }
  }

  // Analyserer dokumentet - laster opp og sender til backend
  const analyze = async () => {
    // Validerer at fil og standard er valgt
    if (!file || !guideline) {
      toast({
        title: "Error",
        description: "Select file and standard",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Henter nåværende autentisert bruker
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Lager unikt filnavn og path i storage
      const fileName = `${Date.now()}-${file.name}`
      const filePath = `${user.id}/${fileName}`

      // Laster opp fil til Supabase storage
      const { error: uploadErr } = await supabase.storage
        .from("compliance-documents")
        .upload(filePath, file, { upsert: false })

      if (uploadErr) throw uploadErr

      // Kaller backend-funksjonen for analyse
      const { data, error } = await supabase.functions.invoke(
        "analyze-document",
        {
          body: {
            filePath,
            fileName: file.name,
            guidelineId: guideline,
          },
        }
      )

      console.log("Analysis response:", { data, error })

      if (error) {
        console.error("Function error:", error)
        throw error
      }

      // Viser resultater hvis analyse var vellykket
      if (data?.analysis_results || data?.data?.analysis_results) {
        const results = data.analysis_results || data.data.analysis_results
        setResult(results)
        toast({
          title: "Analysis complete",
          description: `Score: ${results.score || data.compliance_score || 0}%`,
        })
      } else if (data?.error) {
        throw new Error(data.error)
      } else {
        console.error("Unexpected response:", data)
        throw new Error("Analysis failed - invalid response format")
      }
    } catch (err: any) {
      // Håndterer feil
      toast({
        title: "Error",
        description: err.message || "Failed",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Returnerer riktig farglagt badge basert på status
  const getStatusBadge = (status: string) => {
    if (status === "met") return <Badge>Met</Badge>
    if (status === "partial") return <Badge variant="outline">Partial</Badge>
    return <Badge variant="destructive">Not Met</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Opplastings-kort med fil- og standard-velger */}
      <Card>
        <CardHeader>
          <CardTitle>Analyze Document</CardTitle>
          <CardDescription>
            Upload a document for AI compliance analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Velger hvilken standard å analysere mot */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Standard</label>
            <Select value={guideline} onValueChange={setGuideline}>
              <SelectTrigger>
                <SelectValue placeholder="Choose standard..." />
              </SelectTrigger>
              <SelectContent>
                {guidelines.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.code} - {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Velger fil å analysere */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select File</label>
            <input
              ref={inputRef}
              type="file"
              onChange={handleFile}
              className="hidden"
            />
            <Button
              onClick={() => inputRef.current?.click()}
              variant="outline"
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {file ? file.name : "Choose file"}
            </Button>
          </div>

          {/* Knapp for å starte analyse */}
          <Button
            onClick={analyze}
            disabled={loading || !file || !guideline}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Viser resultater hvis de finnes */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            {/* Viser hovedscoren */}
            <div className="text-3xl font-bold mt-2">{result.score}%</div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Viser oppsummering */}
            <p className="text-sm text-gray-600">{result.summary}</p>

            {/* Lister hver kontroll med status */}
            <div className="space-y-3">
              {result.controls &&
                result.controls.map((ctrl, i) => (
                  <div key={i} className="border rounded p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">
                          {ctrl.number}: {ctrl.title}
                        </p>
                        <p className="text-sm text-gray-600">{ctrl.reason}</p>
                      </div>
                      {getStatusBadge(ctrl.status)}
                    </div>
                    {/* Viser forslag hvis det finnes */}
                    {ctrl.suggestions && (
                      <p className="text-sm text-gray-500 italic">
                        Suggestions: {ctrl.suggestions}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
