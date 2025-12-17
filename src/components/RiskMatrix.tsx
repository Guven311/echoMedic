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

// Bestem bakgrunnsfarge for valgt celle
const getSelectedColor = (score: number): string => {
  if (score >= 12) return "ring-4 ring-red-700 bg-red-600";
  if (score >= 8) return "ring-4 ring-orange-700 bg-orange-600";
  if (score >= 4) return "ring-4 ring-yellow-700 bg-yellow-600";
  return "ring-4 ring-green-700 bg-green-600";
};

export function RiskMatrix({ probability, consequence, onSelect }: RiskMatrixProps) {
  const selectedProbIndex = probability ? levels.indexOf(probability as typeof levels[number]) : -1;
  const selectedConsIndex = consequence ? levels.indexOf(consequence as typeof levels[number]) : -1;

  return (
    <div className="space-y-2">
      <div className="flex">
        {/* Y-akse label */}
        <div className="w-20 flex items-center justify-center">
          <span className="text-xs font-medium text-muted-foreground -rotate-90 whitespace-nowrap">
            Sannsynlighet
          </span>
        </div>
        
        {/* Matrise-grid */}
        <div className="flex-1 max-w-[280px]">
          {/* Kolonneoverskrifter (Konsekvens) */}
          <div className="flex mb-1">
            <div className="w-14" /> {/* Tomt hjørne */}
            {levels.map((level) => (
              <div key={level} className="flex-1 text-center text-xs font-medium text-muted-foreground px-0.5">
                {levelLabels[level]}
              </div>
            ))}
          </div>
          
          {/* Rader (fra høyest til lavest sannsynlighet) */}
          {[...levels].reverse().map((prob, reversedProbIndex) => {
            const probIndex = levels.length - 1 - reversedProbIndex;
            return (
              <div key={prob} className="flex items-center mb-1">
                {/* Rad-label */}
                <div className="w-14 text-xs font-medium text-muted-foreground text-right pr-2">
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
                        "flex-1 aspect-square m-0.5 rounded-md flex items-center justify-center text-sm font-bold transition-all cursor-pointer",
                        getRiskColor(score),
                        isSelected && getSelectedColor(score)
                      )}
                    >
                      {score}
                    </button>
                  );
                })}
              </div>
            );
          })}
          
          {/* X-akse label */}
          <div className="text-center mt-2">
            <span className="text-xs font-medium text-muted-foreground">Konsekvens</span>
          </div>
        </div>
      </div>
      
      {/* Legende */}
      <div className="flex justify-center gap-3 mt-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3.5 h-3.5 rounded bg-green-500" />
          <span>Lav (1-3)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3.5 h-3.5 rounded bg-yellow-500" />
          <span>Middels (4-6)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3.5 h-3.5 rounded bg-orange-500" />
          <span>Høy (8-9)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3.5 h-3.5 rounded bg-red-500" />
          <span>Kritisk (12-16)</span>
        </div>
      </div>
    </div>
  );
}
