// Importer Supabase-klient fra integrerings-mappen
// Dette er så vi kan bruke Supabase overalt i appen
// uten å måtte gjenta import-stien hver gang
import { supabase } from "@/integrations/supabase/client"

// Re-eksporter klienten derfra andre filer kan importere den direkte herfra
// Dette er en convenience-wrapper som gjør import-stiene enklere og mer konsistente
// Andre filer importerer som: import { supabase } from "@/lib/supabase"
// Istedenfor: import { supabase } from "@/integrations/supabase/client"
export { supabase }
