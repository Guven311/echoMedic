import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const createUserSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Ugyldig e-postformat" })
    .max(255, { message: "E-post kan ikke være lengre enn 255 tegn" })
    .transform(val => val.toLowerCase()),
  password: z.string()
    .min(12, { message: "Passord må være minst 12 tegn" })
    .max(128, { message: "Passord kan ikke være lengre enn 128 tegn" })
    .regex(/[A-Z]/, { message: "Passord må inneholde minst én stor bokstav" })
    .regex(/[a-z]/, { message: "Passord må inneholde minst én liten bokstav" })
    .regex(/[0-9]/, { message: "Passord må inneholde minst ett tall" })
    .regex(/[^A-Za-z0-9]/, { message: "Passord må inneholde minst ett spesialtegn" }),
  fullName: z.string()
    .trim()
    .max(100, { message: "Navn kan ikke være lengre enn 100 tegn" })
    .optional()
    .default(""),
  role: z.enum(["admin", "bruker"], { 
    errorMap: () => ({ message: "Rolle må være 'admin' eller 'bruker'" })
  }).optional().default("bruker"),
});

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

    // Sjekk admin-tilgang via rolle
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Kun admin kan opprette brukere" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Parse and validate input
    const rawInput = await req.json();
    const validationResult = createUserSchema.safeParse(rawInput);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(", ");
      console.error("Valideringsfeil:", errors);
      return new Response(
        JSON.stringify({ error: errors }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { email, password, fullName, role } = validationResult.data;

    console.log(`Creating user: ${email} with role: ${role}`);

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
        full_name: fullName,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      throw createError;
    }

    // Tildel rolle
    if (newUser?.user) {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .upsert({
          user_id: newUser.user.id,
          role: role,
        }, { onConflict: "user_id" });

      if (roleError) {
        console.error("Error assigning role:", roleError);
      }
    }

    console.log(`User created successfully: ${newUser?.user?.id}`);

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
