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
        JSON.stringify({ error: "Kun admin kan se brukerlisten" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Hent alle brukere
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      throw listError;
    }

    // Hent roller for alle brukere
    const { data: rolesData } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");

    const rolesMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);

    // Hent profiler
    const { data: profilesData } = await supabaseAdmin
      .from("profiles")
      .select("user_id, full_name, avatar_url");

    const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

    const users = usersData?.users?.map(user => ({
      id: user.id,
      email: user.email,
      fullName: profilesMap.get(user.id)?.full_name || user.user_metadata?.full_name || "",
      avatarUrl: profilesMap.get(user.id)?.avatar_url || "",
      role: rolesMap.get(user.id) || "bruker",
      createdAt: user.created_at,
      lastSignIn: user.last_sign_in_at,
    })) || [];

    return new Response(
      JSON.stringify({ users }),
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
