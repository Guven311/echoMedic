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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Ikke autorisert" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verifiser at brukeren er admin
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user: currentUser } } = await supabaseClient.auth.getUser();
    
    if (!currentUser || currentUser.email !== "admin@admin.no") {
      // Sjekk også om brukeren har admin-rolle
      const { data: roleData } = await supabaseClient
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser?.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        return new Response(
          JSON.stringify({ error: "Kun admin kan opprette brukere" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
        );
      }
    }

    const { email, password, fullName, role } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "E-post og passord er påkrevd" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Bruk service role for å opprette bruker
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Opprett bruker
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || "",
      },
    });

    if (createError) {
      throw createError;
    }

    // Tildel rolle hvis angitt
    if (newUser?.user && role) {
      await supabaseAdmin
        .from("user_roles")
        .upsert({
          user_id: newUser.user.id,
          role: role,
        }, { onConflict: "user_id" });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Bruker opprettet",
        user: {
          id: newUser?.user?.id,
          email: newUser?.user?.email,
        }
      }),
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
