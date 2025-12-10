// @ts-ignore - Deno environment
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

// @ts-ignore - Deno.serve
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("Analyze document function called")

    // Parse request
    const body = await req.json()
    console.log("Request body:", body)

    const { filePath, fileName, guidelineId } = body

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

    console.log("Returning mock result")

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
