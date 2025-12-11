// Supabase-klient med fallback-verdier
// Brukes når miljøvariabler ikke er tilgjengelige
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Hent verdier fra miljøvariabler eller bruk fallback
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://wybkixbkhgfqcmmrczbl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5YmtpeGJraGdmcWNtbXJjemJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MjcwMDcsImV4cCI6MjA4MDIwMzAwN30.pItGMbtY7SZd0_3_ecDsl1QD1SEmEH9V_C5FvcnKA7k";

// Opprett Supabase-klient
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
