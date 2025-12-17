import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RiskRequest {
  filePath: string;
  fileName: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get auth header and create authenticated client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    // Parse request
    const { filePath, fileName }: RiskRequest = await req.json();

    if (!filePath || !fileName) {
      throw new Error('Missing required fields: filePath and fileName');
    }

    console.log(`Analyzing risk for document: ${fileName}`);

    // Download the document
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('compliance-documents')
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error(`Failed to download document: ${downloadError.message}`);
    }

    // Extract document content
    let documentContent = '';
    const fileExtension = fileName.toLowerCase().split('.').pop();

    if (['txt', 'md', 'csv', 'json', 'xml'].includes(fileExtension || '')) {
      documentContent = await fileData.text();
    } else if (fileExtension === 'pdf') {
      documentContent = await fileData.text();
    } else {
      documentContent = await fileData.text();
    }

    // Limit content size
    const maxContentLength = 15000;
    if (documentContent.length > maxContentLength) {
      documentContent = documentContent.substring(0, maxContentLength) + '\n\n[Dokumentet er forkortet for analyse...]';
    }

    // Fetch known threats and vulnerabilities from database
    const [threatsResult, vulnerabilitiesResult] = await Promise.all([
      supabase.from('threats').select('*'),
      supabase.from('vulnerabilities').select('*')
    ]);

    const knownThreats = threatsResult.data || [];
    const knownVulnerabilities = vulnerabilitiesResult.data || [];

    console.log(`Found ${knownThreats.length} threats and ${knownVulnerabilities.length} vulnerabilities`);

    // Build the AI prompt
    const systemPrompt = `Du er en ekspert på informasjonssikkerhet og risikovurdering. 
Analyser det vedlagte dokumentet for å identifisere sikkerhetsrisikoer.

Du har tilgang til følgende kjente trusler:
${knownThreats.map(t => `- ${t.title}: ${t.description} (Kategori: ${t.category}, Alvorlighetsgrad: ${t.severity})`).join('\n')}

Og følgende kjente sårbarheter:
${knownVulnerabilities.map(v => `- ${v.title}: ${v.description} (Alvorlighetsgrad: ${v.severity}, Status: ${v.status})`).join('\n')}

Analyser dokumentet og returner resultatet som JSON med følgende struktur:
{
  "summary": "Kort oppsummering av risikovurderingen",
  "overall_risk_level": "lav|middels|hoy|kritisk",
  "identified_threats": [
    {
      "title": "Trusselens navn",
      "description": "Beskrivelse av trusselen",
      "probability": "lav|middels|hoy|kritisk",
      "consequence": "lav|middels|hoy|kritisk",
      "risk_score": 1-16,
      "mitigation": "Forslag til tiltak"
    }
  ],
  "identified_vulnerabilities": [
    {
      "title": "Sårbarhetens navn",
      "description": "Beskrivelse av sårbarheten",
      "severity": "low|medium|high|critical",
      "affected_area": "Berørt område",
      "recommendation": "Anbefaling"
    }
  ],
  "risk_matrix": {
    "probability": "lav|middels|hoy|kritisk",
    "consequence": "lav|middels|hoy|kritisk"
  },
  "recommendations": ["Liste med anbefalinger"]
}

Bruk risikomatrisen der score beregnes som: (sannsynlighet 1-4) * (konsekvens 1-4) = 1-16
- Lav: score 1-3
- Middels: score 4-6
- Høy: score 8-9
- Kritisk: score 12-16`;

    const userMessage = `Analyser følgende dokument for sikkerhetsrisikoer:\n\nFilnavn: ${fileName}\n\nInnhold:\n${documentContent}`;

    // Call Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit overskredet. Prøv igjen senere.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Betalingskrevende. Legg til kreditter.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error('No content in AI response');
    }

    console.log('AI response received, parsing...');

    // Parse the JSON response
    let analysisResults;
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : aiContent.trim();
      analysisResults = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Create a fallback response
      analysisResults = {
        summary: 'Kunne ikke parse AI-respons. Manuell vurdering anbefales.',
        overall_risk_level: 'middels',
        identified_threats: [],
        identified_vulnerabilities: [],
        risk_matrix: { probability: 'middels', consequence: 'middels' },
        recommendations: ['Gjennomfør manuell risikovurdering']
      };
    }

    // Store results in database
    const { error: insertError } = await supabase
      .from('risk_analysis_results')
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_path: filePath,
        analysis_results: analysisResults,
        identified_threats: analysisResults.identified_threats,
        identified_vulnerabilities: analysisResults.identified_vulnerabilities,
        risk_matrix: analysisResults.risk_matrix,
        overall_risk_level: analysisResults.overall_risk_level,
      });

    if (insertError) {
      console.error('Insert error:', insertError);
    }

    console.log('Risk analysis completed successfully');

    return new Response(JSON.stringify({
      success: true,
      analysis_results: analysisResults,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Risk analysis error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
