import { cn } from "@/lib/utils";

interface RiskMatrixProps {
  probability?: string;
  consequence?: string;
  onSelect: (probability: string, consequence: string) => void;
}

// Verdier for sannsynlighet og konsekvens
const levels = ["lav", "middels", "hoy", "kritisk"] as const;
const levelLabels: Record<string, string> = {
  lav: "Lav",
  middels: "Middels",
  hoy: "Høy",
  kritisk: "Kritisk",
};

// Beregn risikoscore
const calculateScore = (probIndex: number, consIndex: number): number => {
  return (probIndex + 1) * (consIndex + 1);
};

// Bestem farge basert på risikoscore
const getRiskColor = (score: number): string => {
  if (score >= 12) return "bg-red-500 hover:bg-red-600 text-white";
  if (score >= 8) return "bg-orange-500 hover:bg-orange-600 text-white";
  if (score >= 4) return "bg-yellow-500 hover:bg-yellow-600 text-black";
  return "bg-green-500 hover:bg-green-600 text-white";
};

// Bestem bakgrunnsfarge for valgt celle med tydelig markering
const getSelectedColor = (score: number): string => {
  if (score >= 12) return "ring-4 ring-offset-2 ring-red-900 bg-red-600 scale-110 shadow-lg";
  if (score >= 8) return "ring-4 ring-offset-2 ring-orange-900 bg-orange-600 scale-110 shadow-lg";
  if (score >= 4) return "ring-4 ring-offset-2 ring-yellow-900 bg-yellow-600 scale-110 shadow-lg";
  return "ring-4 ring-offset-2 ring-green-900 bg-green-600 scale-110 shadow-lg";
};

export function RiskMatrix({ probability, consequence, onSelect }: RiskMatrixProps) {
  const selectedProbIndex = probability ? levels.indexOf(probability as typeof levels[number]) : -1;
  const selectedConsIndex = consequence ? levels.indexOf(consequence as typeof levels[number]) : -1;

  return (
    <div className="space-y-4 flex flex-col items-center">
      <div className="flex">
        {/* Y-akse label */}
        <div className="w-28 flex items-center justify-center">
          <span className="text-base font-semibold text-muted-foreground -rotate-90 whitespace-nowrap">
            Sannsynlighet
          </span>
        </div>
        
        {/* Matrise-grid */}
        <div className="flex-1 w-[400px]">
          {/* Kolonneoverskrifter (Konsekvens) */}
          <div className="flex mb-2">
            <div className="w-20" /> {/* Tomt hjørne */}
            {levels.map((level) => (
              <div key={level} className="flex-1 text-center text-sm font-semibold text-muted-foreground px-1">
                {levelLabels[level]}
              </div>
            ))}
          </div>
          
          {/* Rader (fra høyest til lavest sannsynlighet) */}
          {[...levels].reverse().map((prob, reversedProbIndex) => {
            const probIndex = levels.length - 1 - reversedProbIndex;
            return (
              <div key={prob} className="flex items-center mb-2">
                {/* Rad-label */}
                <div className="w-20 text-sm font-semibold text-muted-foreground text-right pr-3">
                  {levelLabels[prob]}
                </div>
                {/* Celler */}
                {levels.map((cons, consIndex) => {
                  const score = calculateScore(probIndex, consIndex);
                  const isSelected = probIndex === selectedProbIndex && consIndex === selectedConsIndex;
                  
                  return (
                    <button
                      key={`${prob}-${cons}`}
                      type="button"
                      onClick={() => onSelect(prob, cons)}
                      className={cn(
                        "flex-1 aspect-square m-1 rounded-lg flex items-center justify-center text-lg font-bold transition-all cursor-pointer relative",
                        getRiskColor(score),
                        isSelected && getSelectedColor(score)
                      )}
                    >
                      {score}
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-current" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
          
          {/* X-akse label */}
          <div className="text-center mt-3">
            <span className="text-base font-semibold text-muted-foreground">Konsekvens</span>
          </div>
        </div>
      </div>
      
      {/* Legende */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-green-500" />
          <span>Lav (1-3)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-yellow-500" />
          <span>Middels (4-6)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-orange-500" />
          <span>Høy (8-9)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-red-500" />
          <span>Kritisk (12-16)</span>
        </div>
      </div>
      
      {/* Valgt indikator */}
      {selectedProbIndex >= 0 && selectedConsIndex >= 0 && (
        <div className="text-center text-sm text-muted-foreground mt-2 p-2 bg-muted rounded-lg">
          <span className="font-medium">Valgt fra dokument: </span>
          Sannsynlighet: <span className="font-semibold">{levelLabels[levels[selectedProbIndex]]}</span>, 
          Konsekvens: <span className="font-semibold">{levelLabels[levels[selectedConsIndex]]}</span>
        </div>
      )}
    </div>
  );
}
