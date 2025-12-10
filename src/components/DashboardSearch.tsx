// Importerer hooks og komponenter for søk
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Search, FileText, Shield, AlertTriangle, BookOpen } from "lucide-react";

// Interface for søkeresultater
interface SearchResult {
  id: string;
  title: string;
  type: "framework" | "guideline" | "risk" | "document";
  description?: string;
}

// Søke-komponent for dashboard
export function DashboardSearch() {
  // State for søk, resultater og loading
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Søker i alle databaser når query endres
  useEffect(() => {
    const searchData = async () => {
      // Viser ikke resultater hvis mindre enn 2 tegn
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const searchTerm = `%${query}%`;

        // Søker parallelt i alle tabeller
        const [frameworks, guidelines, risks, documents] = await Promise.all([
          supabase
            .from("frameworks")
            .select("id, name, description")
            .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
            .limit(3),
          supabase
            .from("guidelines")
            .select("id, name, description")
            .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
            .limit(3),
          supabase
            .from("risk_assessments")
            .select("id, title, description")
            .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
            .limit(3),
          supabase
            .from("documents")
            .select("id, title, description")
            .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
            .limit(3),
        ]);

        // Kombinerer resultater fra alle kilder
        const allResults: SearchResult[] = [
          ...(frameworks.data || []).map((f) => ({
            id: f.id,
            title: f.name,
            type: "framework" as const,
            description: f.description,
          })),
          ...(guidelines.data || []).map((g) => ({
            id: g.id,
            title: g.name,
            type: "guideline" as const,
            description: g.description,
          })),
          ...(risks.data || []).map((r) => ({
            id: r.id,
            title: r.title,
            type: "risk" as const,
            description: r.description,
          })),
          ...(documents.data || []).map((d) => ({
            id: d.id,
            title: d.title,
            type: "document" as const,
            description: d.description,
          })),
        ];

        setResults(allResults);
      } catch (error) {
        // Logger søk-feil
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    // Debouncer søk-kall for å unngå for mange spørringer
    const debounce = setTimeout(searchData, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  // Håndterer valg av søkeresultat
  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    
    // Navigerer til riktig side basert på resultat-type
    switch (result.type) {
      case "framework":
        navigate("/rammeverk");
        break;
      case "guideline":
        navigate("/retningslinjer");
        break;
      case "risk":
        navigate("/risiko");
        break;
      case "document":
        navigate("/dokumenter");
        break;
    }
  };

  // Returnerer ikon basert på resultat-type
  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "framework":
        return <Shield className="h-4 w-4 text-primary" />;
      case "guideline":
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      case "risk":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "document":
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Returnerer tekst-etikett basert på resultat-type
  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "framework":
        return "Rammeverk";
      case "guideline":
        return "Retningslinje";
      case "risk":
        return "Risiko";
      case "document":
        return "Dokument";
    }
  };

  // Returnerer søke-input og resultater-dropdown
  return (
    <div className="relative w-full max-w-md">
      {/* Søke-ikon i inputt */}
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
      {/* Søke-inputt */}
      <Input
        placeholder="Søk i rammeverk, retningslinjer, risikoer, dokumenter..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (e.target.value.length >= 2) setOpen(true);
          else setOpen(false);
        }}
        onFocus={() => query.length >= 2 && setOpen(true)}
        onBlur={() => {
          setTimeout(() => setOpen(false), 200);
        }}
        className="pl-10"
      />
      {/* Dropdown med resultater */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover border border-border rounded-md shadow-lg max-h-80 overflow-y-auto">
          {/* Loading-tilstand */}
          {loading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Søker...
            </div>
          )}
          {/* Tilstand når ingen resultater */}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Ingen resultater funnet.
            </div>
          )}
          {/* Viser resultater gruppert etter type */}
          {!loading && results.length > 0 && (
            <div className="py-2">
              {["framework", "guideline", "risk", "document"].map((type) => {
                const typeResults = results.filter((r) => r.type === type);
                if (typeResults.length === 0) return null;
                return (
                  <div key={type}>
                    {/* Type-header for resultater */}
                    <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                      {getTypeLabel(type as SearchResult["type"])}
                    </div>
                    {/* Lister resultater av denne typen */}
                    {typeResults.map((result) => (
                      <div
                        key={result.id}
                        onMouseDown={() => handleSelect(result)}
                        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent"
                      >
                        {/* Resultat-ikon */}
                        {getIcon(result.type)}
                        <div className="flex-1 overflow-hidden">
                          {/* Resultat-tittel */}
                          <p className="truncate font-medium text-sm">{result.title}</p>
                          {/* Resultat-beskrivelse */}
                          {result.description && (
                            <p className="truncate text-xs text-muted-foreground">
                              {result.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
