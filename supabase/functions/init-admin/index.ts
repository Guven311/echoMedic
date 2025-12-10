import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const adminEmail = "admin@admin.no";
    const adminPassword = "12345678@";

    // Sjekk om admin allerede eksisterer
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const adminExists = existingUsers?.users?.some(u => u.email === adminEmail);

    if (adminExists) {
      return new Response(
        JSON.stringify({ message: "Admin-konto eksisterer allerede" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Opprett admin-bruker
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: "Administrator",
      },
    });

    if (createError) {
      throw createError;
    }

    // Gi admin-rolle
    if (newUser?.user) {
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({
          user_id: newUser.user.id,
          role: "admin",
        }, { onConflict: "user_id" });

      if (roleError) {
        console.error("Feil ved tildeling av admin-rolle:", roleError);
      }
    }

    return new Response(
      JSON.stringify({ message: "Admin-konto opprettet", userId: newUser?.user?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    console.error("Feil:", error);
    const message = error instanceof Error ? error.message : "Ukjent feil";
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
