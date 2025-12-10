// Importer Supabase-klient fra integrerings-mappen
// Dette er så vi kan bruke Supabase overalt i appen uten unødvendig gjentakelse
import { supabase } from "@/integrations/supabase/client";

// Eksporter klienten så andre filer kan importere den direkte herfra
// Praktisk for å holde import-stienes enkleste måte
export { supabase };
