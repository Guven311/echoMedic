import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const send2FASchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Ugyldig e-postformat" })
    .max(255, { message: "E-post kan ikke være lengre enn 255 tegn" })
    .transform(val => val.toLowerCase()),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const rawInput = await req.json();
    const validationResult = send2FASchema.safeParse(rawInput);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(", ");
      console.error("Valideringsfeil:", errors);
      return new Response(
        JSON.stringify({ error: errors }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { email } = validationResult.data;

    console.log(`Processing 2FA request for: ${email}`);

    // Get admin email from secrets to check for 2FA bypass
    const adminEmail = Deno.env.get("ADMIN_EMAIL")?.toLowerCase();
    
    // Admin trenger ikke 2FA
    if (adminEmail && email === adminEmail) {
      console.log("Admin user detected, skipping 2FA");
      return new Response(
        JSON.stringify({ bypass: true, message: "Admin trenger ikke 2FA" }),
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

    // Generer 6-sifret kode (kryptografisk sikker)
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const code = String(100000 + (array[0] % 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutter

    // Slett gamle koder for denne e-posten
    await supabase.from("two_factor_codes").delete().eq("email", email);

    // Lagre ny kode
    const { error: insertError } = await supabase.from("two_factor_codes").insert({
      email: email,
      code,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error("Error inserting 2FA code:", insertError);
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
      } else {
        console.log("2FA code sent successfully");
      }
    } else {
      console.warn("RESEND_API_KEY not configured, email not sent");
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
