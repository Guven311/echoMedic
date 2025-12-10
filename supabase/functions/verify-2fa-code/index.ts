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
    const { email, code } = await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: "E-post og kode er påkrevd" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Sjekk koden
    const { data: codeData, error: fetchError } = await supabase
      .from("two_factor_codes")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("code", code)
      .eq("verified", false)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (fetchError || !codeData) {
      return new Response(
        JSON.stringify({ error: "Ugyldig eller utløpt kode" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Marker koden som verifisert
    await supabase
      .from("two_factor_codes")
      .update({ verified: true })
      .eq("id", codeData.id);

    return new Response(
      JSON.stringify({ success: true, message: "Kode verifisert" }),
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
