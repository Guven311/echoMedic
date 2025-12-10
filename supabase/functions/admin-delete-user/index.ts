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
    
    if (!currentUser) {
      return new Response(
        JSON.stringify({ error: "Ikke autorisert" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Sjekk admin-tilgang
    const isAdminEmail = currentUser.email === "admin@admin.no";
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .eq("role", "admin")
      .single();

    if (!isAdminEmail && !roleData) {
      return new Response(
        JSON.stringify({ error: "Kun admin kan slette brukere" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Bruker-ID er påkrevd" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Ikke tillat sletting av seg selv
    if (userId === currentUser.id) {
      return new Response(
        JSON.stringify({ error: "Du kan ikke slette din egen konto" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Slett brukeren
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      throw deleteError;
    }

    return new Response(
      JSON.stringify({ success: true, message: "Bruker slettet" }),
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
