// Importerer React DOM for å rendere appen
import { createRoot } from "react-dom/client"
// Importerer hovedappen
import App from "./App.tsx"
// Importerer globale CSS-stiler
import "./index.css"

// Debug-info: Viser environment-variabler i konsolen
// Brukes til å sjekke at Supabase-config er satt korrekt
console.log("ENV DEBUG:", {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    ? "SET"
    : "NOT SET",
  MODE: import.meta.env.MODE,
  ALL_ENV: import.meta.env,
})

// Finner HTML-element med id="root" og renderer appen der
// Den ! sier TypeScript at vi vet elementet finnes
createRoot(document.getElementById("root")!).render(<App />)
