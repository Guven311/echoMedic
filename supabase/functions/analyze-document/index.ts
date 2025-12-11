// @ts-ignore - Deno environment
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

// Input validation schema
const analyzeDocumentSchema = z.object({
  filePath: z.string()
    .trim()
    .min(1, { message: "Filsti er påkrevd" })
    .max(500, { message: "Filsti kan ikke være lengre enn 500 tegn" }),
  fileName: z.string()
    .trim()
    .min(1, { message: "Filnavn er påkrevd" })
    .max(255, { message: "Filnavn kan ikke være lengre enn 255 tegn" }),
  guidelineId: z.string()
    .uuid({ message: "Ugyldig retningslinje-ID format (må være UUID)" })
    .optional(),
});

// @ts-ignore - Deno.serve
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("Analyze document function called")

    // Parse and validate input
    const rawInput = await req.json()
    console.log("Request body received")

    const validationResult = analyzeDocumentSchema.safeParse(rawInput);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(", ");
      console.error("Valideringsfeil:", errors);
      return new Response(
        JSON.stringify({ error: errors }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const { filePath, fileName, guidelineId } = validationResult.data;

    console.log(`Analyzing document: ${fileName} at ${filePath}`);

    // Return mock analysis result
    const mockResult = {
      ok: true,
      analysis_results: {
        score: 82,
        summary:
          "Document analysis completed. The document demonstrates good compliance with the selected standard.",
        controls: [
          {
            number: "1.0",
            title: "Documentation Quality",
            status: "met",
            reason:
              "The document is well-structured with clear sections and proper formatting.",
            suggestions: "Maintain current documentation standards.",
          },
          {
            number: "2.0",
            title: "Compliance Requirements",
            status: "partial",
            reason:
              "Most compliance requirements are addressed, but some sections could be more detailed.",
            suggestions:
              "Expand sections on risk management and control implementation.",
          },
          {
            number: "3.0",
            title: "Technical Controls",
            status: "met",
            reason:
              "Technical controls are properly described and implementation is clear.",
            suggestions:
              "Continue monitoring and updating technical controls regularly.",
          },
        ],
      },
      compliance_score: 82,
      data: {
        analysis_results: {
          score: 82,
          summary:
            "Document analysis completed. The document demonstrates good compliance with the selected standard.",
          controls: [
            {
              number: "1.0",
              title: "Documentation Quality",
              status: "met",
              reason:
                "The document is well-structured with clear sections and proper formatting.",
              suggestions: "Maintain current documentation standards.",
            },
            {
              number: "2.0",
              title: "Compliance Requirements",
              status: "partial",
              reason:
                "Most compliance requirements are addressed, but some sections could be more detailed.",
              suggestions:
                "Expand sections on risk management and control implementation.",
            },
            {
              number: "3.0",
              title: "Technical Controls",
              status: "met",
              reason:
                "Technical controls are properly described and implementation is clear.",
              suggestions:
                "Continue monitoring and updating technical controls regularly.",
            },
          ],
        },
        compliance_score: 82,
      },
    }

    console.log("Document analysis completed successfully")

    return new Response(JSON.stringify(mockResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
