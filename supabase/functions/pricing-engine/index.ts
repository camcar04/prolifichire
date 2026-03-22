import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

const VALID_OPERATION_TYPES = [
  "spraying", "planting", "harvest", "tillage", "fertilizing", "hauling",
  "grain_hauling", "scouting", "soil_sampling", "seeding", "mowing",
  "baling", "rock_picking", "drainage", "other"
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Authenticate
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate
    let body: any;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { operation_type, acreage, travel_distance, urgency, crop, field_complexity, historical_avg, route_clustered } = body;

    if (!operation_type || !VALID_OPERATION_TYPES.includes(operation_type)) {
      return new Response(JSON.stringify({ error: "Invalid operation type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeAcreage = Math.max(0, Math.min(Number(acreage) || 0, 100000));
    const safeDistance = Math.max(0, Math.min(Number(travel_distance) || 0, 1000));
    const safeUrgency = ["normal", "high", "critical"].includes(urgency) ? urgency : "normal";

    if (safeAcreage <= 0) {
      return new Response(JSON.stringify({ error: "Acreage must be positive" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

    const prompt = `You are an agricultural pricing expert. Generate a pricing estimate for the following custom farm work job.

Operation: ${operation_type}
Acreage: ${safeAcreage} acres
Crop: ${String(crop || "row crop").slice(0, 50)}
Travel distance: ${safeDistance} miles
Urgency: ${safeUrgency}
Field complexity: ${String(field_complexity || "standard").slice(0, 50)}
Historical average cost/acre for this area: $${String(historical_avg || "38-45").slice(0, 20)}
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
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI service unavailable");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response");

    const pricing = JSON.parse(jsonMatch[0]);

    // Validate AI output numbers
    const safePricing = {
      low_per_acre: Math.max(0, Number(pricing.low_per_acre) || 0),
      recommended_per_acre: Math.max(0, Number(pricing.recommended_per_acre) || 0),
      high_per_acre: Math.max(0, Number(pricing.high_per_acre) || 0),
      base_rate_per_acre: Math.max(0, Number(pricing.base_rate_per_acre) || 0),
      travel_cost_total: Math.max(0, Number(pricing.travel_cost_total) || 0),
      urgency_adjustment: Number(pricing.urgency_adjustment) || 0,
      clustering_discount: Math.max(0, Number(pricing.clustering_discount) || 0),
      fill_likelihood: ["high", "medium", "low"].includes(pricing.fill_likelihood) ? pricing.fill_likelihood : "medium",
      reasoning: String(pricing.reasoning || "").slice(0, 500),
    };

    return new Response(JSON.stringify({
      low_estimate: Math.round(safePricing.low_per_acre * safeAcreage * 100) / 100,
      recommended_estimate: Math.round(safePricing.recommended_per_acre * safeAcreage * 100) / 100,
      high_estimate: Math.round(safePricing.high_per_acre * safeAcreage * 100) / 100,
      base_rate: safePricing.base_rate_per_acre,
      travel_cost: safePricing.travel_cost_total,
      urgency_adjustment: safePricing.urgency_adjustment,
      clustering_discount: safePricing.clustering_discount,
      fill_likelihood: safePricing.fill_likelihood,
      reasoning: safePricing.reasoning,
      per_acre: {
        low: safePricing.low_per_acre,
        recommended: safePricing.recommended_per_acre,
        high: safePricing.high_per_acre,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("pricing-engine error:", e);
    return new Response(JSON.stringify({ error: "Pricing estimation failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
