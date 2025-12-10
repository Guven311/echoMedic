import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Debug environment variables
console.log("ENV DEBUG:", {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? "SET" : "NOT SET",
  MODE: import.meta.env.MODE,
  ALL_ENV: import.meta.env
});

createRoot(document.getElementById("root")!).render(<App />);
