import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { operation_type, acreage, travel_distance, urgency, crop, field_complexity, historical_avg, route_clustered } = await req.json();

    const prompt = `You are an agricultural pricing expert. Generate a pricing estimate for the following custom farm work job.

Operation: ${operation_type}
Acreage: ${acreage} acres
Crop: ${crop || "row crop"}
Travel distance: ${travel_distance || "unknown"} miles
Urgency: ${urgency || "normal"}
Field complexity: ${field_complexity || "standard"}
Historical average cost/acre for this area: $${historical_avg || "38-45"}
Route clustered with other jobs: ${route_clustered ? "yes (apply 5-10% discount)" : "no"}

Return a JSON object with these exact fields:
- low_per_acre: number (lowest reasonable per-acre rate)
- recommended_per_acre: number (fair market rate)  
- high_per_acre: number (premium rate)
- base_rate_per_acre: number (base rate before adjustments)
- travel_cost_total: number (total travel cost)
- urgency_adjustment: number (0 if normal, positive if urgent)
- clustering_discount: number (discount amount if clustered)
- fill_likelihood: "high" | "medium" | "low" (likelihood an operator will accept)
- reasoning: string (1-2 sentence explanation of pricing factors)

Only return the JSON object, nothing else.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a precision agriculture pricing engine. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway returned ${status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI response");

    const pricing = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({
      low_estimate: Math.round(pricing.low_per_acre * acreage * 100) / 100,
      recommended_estimate: Math.round(pricing.recommended_per_acre * acreage * 100) / 100,
      high_estimate: Math.round(pricing.high_per_acre * acreage * 100) / 100,
      base_rate: pricing.base_rate_per_acre,
      travel_cost: pricing.travel_cost_total,
      urgency_adjustment: pricing.urgency_adjustment,
      clustering_discount: pricing.clustering_discount,
      fill_likelihood: pricing.fill_likelihood,
      reasoning: pricing.reasoning,
      per_acre: {
        low: pricing.low_per_acre,
        recommended: pricing.recommended_per_acre,
        high: pricing.high_per_acre,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("pricing-engine error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
