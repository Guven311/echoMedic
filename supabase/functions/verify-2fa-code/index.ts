import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const verify2FASchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Ugyldig e-postformat" })
    .max(255, { message: "E-post kan ikke være lengre enn 255 tegn" })
    .transform(val => val.toLowerCase()),
  code: z.string()
    .trim()
    .length(6, { message: "Koden må være nøyaktig 6 siffer" })
    .regex(/^\d{6}$/, { message: "Koden må kun inneholde tall" }),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const rawInput = await req.json();
    const validationResult = verify2FASchema.safeParse(rawInput);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(", ");
      console.error("Valideringsfeil:", errors);
      return new Response(
        JSON.stringify({ error: errors }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { email, code } = validationResult.data;

    console.log(`Verifying 2FA code for: ${email}`);

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
      .eq("email", email)
      .eq("code", code)
      .eq("verified", false)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (fetchError || !codeData) {
      console.warn(`Invalid or expired 2FA code for: ${email}`);
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

    console.log(`2FA code verified successfully for: ${email}`);

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
