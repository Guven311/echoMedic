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
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "E-post er påkrevd" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Admin trenger ikke 2FA
    if (email.toLowerCase() === "admin@admin.no") {
      return new Response(
        JSON.stringify({ skip2FA: true, message: "Admin trenger ikke 2FA" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Generer 6-sifret kode
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutter

    // Slett gamle koder for denne e-posten
    await supabase.from("two_factor_codes").delete().eq("email", email.toLowerCase());

    // Lagre ny kode
    const { error: insertError } = await supabase.from("two_factor_codes").insert({
      email: email.toLowerCase(),
      code,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      throw insertError;
    }

    // Send e-post via Resend
    if (resendApiKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "EchoMedic <onboarding@resend.dev>",
          to: [email],
          subject: "Din innloggingskode - EchoMedic",
          html: `
            <h2>Din innloggingskode</h2>
            <p>Bruk denne koden for å fullføre innloggingen:</p>
            <h1 style="font-size: 32px; letter-spacing: 4px; color: #3b82f6;">${code}</h1>
            <p>Koden er gyldig i 10 minutter.</p>
            <p>Hvis du ikke har bedt om denne koden, kan du ignorere denne e-posten.</p>
          `,
        }),
      });

      if (!res.ok) {
        const errorData = await res.text();
        console.error("Resend feil:", errorData);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Kode sendt til e-post" }),
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
