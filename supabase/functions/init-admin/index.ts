import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const initAdminSchema = z.object({
  deploymentSecret: z.string().min(1, "Deployment-hemmelighet er påkrevd"),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Kun POST-forespørsler er tillatt" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Ugyldig JSON i forespørsel" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const validationResult = initAdminSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: "Validering feilet",
          details: validationResult.error.errors.map(e => e.message)
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Verify deployment secret
    const expectedSecret = Deno.env.get("INIT_ADMIN_SECRET");
    if (!expectedSecret) {
      console.error("INIT_ADMIN_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Server-konfigurasjon mangler" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const { deploymentSecret } = validationResult.data;
    
    // Constant-time comparison to prevent timing attacks
    const secretBuffer = new TextEncoder().encode(deploymentSecret);
    const expectedBuffer = new TextEncoder().encode(expectedSecret);
    
    if (secretBuffer.length !== expectedBuffer.length) {
      console.warn("Invalid deployment secret attempt");
      return new Response(
        JSON.stringify({ error: "Ugyldig deployment-hemmelighet" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }
    
    let isValid = true;
    for (let i = 0; i < secretBuffer.length; i++) {
      if (secretBuffer[i] !== expectedBuffer[i]) {
        isValid = false;
      }
    }
    
    if (!isValid) {
      console.warn("Invalid deployment secret attempt");
      return new Response(
        JSON.stringify({ error: "Ugyldig deployment-hemmelighet" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get admin credentials from secrets (not hardcoded)
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");

    // Validate that secrets are configured
    if (!adminEmail || !adminPassword) {
      console.error("Missing required secrets: ADMIN_EMAIL and/or ADMIN_PASSWORD");
      return new Response(
        JSON.stringify({ 
          error: "Admin-legitimasjoner er ikke konfigurert. Kontakt systemadministrator.",
          details: "Missing ADMIN_EMAIL or ADMIN_PASSWORD secrets"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Validate password strength
    if (adminPassword.length < 12) {
      console.error("Admin password does not meet minimum security requirements");
      return new Response(
        JSON.stringify({ 
          error: "Admin-passord oppfyller ikke sikkerhetskravene. Minimum 12 tegn kreves."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("Checking for existing admin user...");

    // Check if admin user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAdmin = existingUsers?.users?.find(u => u.email === adminEmail);

    if (existingAdmin) {
      console.log("Admin user already exists");
      return new Response(
        JSON.stringify({ message: "Admin-bruker eksisterer allerede", userId: existingAdmin.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log("Creating new admin user...");

    // Create admin user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: "Administrator",
      },
    });

    if (createError) {
      console.error("Error creating admin user:", createError);
      throw createError;
    }

    console.log("Admin user created, assigning admin role...");

    // Assign admin role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ 
        user_id: newUser.user.id, 
        role: "admin" 
      }, { 
        onConflict: "user_id" 
      });

    if (roleError) {
      console.error("Error assigning admin role:", roleError);
      throw roleError;
    }

    console.log("Admin initialization completed successfully");

    return new Response(
      JSON.stringify({ 
        message: "Admin-bruker opprettet", 
        userId: newUser.user.id 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 }
    );
  } catch (error: unknown) {
    console.error("Feil ved admin-initialisering:", error);
    const message = error instanceof Error ? error.message : "Ukjent feil";
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
