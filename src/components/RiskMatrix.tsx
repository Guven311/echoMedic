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
  kritisk: "Kritisk"
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
export function RiskMatrix({
  probability,
  consequence,
  onSelect
}: RiskMatrixProps) {
  const selectedProbIndex = probability ? levels.indexOf(probability as typeof levels[number]) : -1;
  const selectedConsIndex = consequence ? levels.indexOf(consequence as typeof levels[number]) : -1;
  return <div className="space-y-2">
      <div className="flex">
        {/* Y-akse label */}
        <div className="w-24 flex items-center justify-center">
          
        </div>
        
        {/* Matrise-grid */}
        
      </div>
      
      {/* Legende */}
      
    </div>;
}