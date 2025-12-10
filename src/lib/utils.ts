// Importer hjelpere for CSS-klasse-håndtering
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Hjelpe-funksjon: kombinerer CSS-klasser med smart merge av Tailwind-konflikter
// cn = "class names" — brukes overalt i komponenter for flexibel styling
export function cn(...inputs: ClassValue[]) {
  // clsx flater ut arrays og betingelser, twMerge fikser Tailwind-duplikater
  return twMerge(clsx(inputs));
}
