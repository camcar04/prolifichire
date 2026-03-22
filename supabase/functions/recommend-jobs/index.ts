import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { user_id, mode, operator_lat, operator_lng, service_types, max_distance } = await req.json();

    if (mode === "operator") {
      // Recommend jobs for operators
      const { data: openJobs } = await supabase
        .from("jobs")
        .select("*, job_fields(field_id, acreage, crop)")
        .in("status", ["requested", "quoted"])
        .limit(50);

      if (!openJobs || openJobs.length === 0) {
        return new Response(JSON.stringify({ recommendations: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get field locations
      const fieldIds = openJobs.flatMap((j: any) => (j.job_fields || []).map((jf: any) => jf.field_id));
      const { data: fieldData } = await supabase
        .from("fields")
        .select("id, centroid_lat, centroid_lng, name")
        .in("id", fieldIds);
      const fieldMap = new Map((fieldData || []).map((f: any) => [f.id, f]));

      // Build context for AI
      const jobSummaries = openJobs.map((j: any) => {
        const field = (j.job_fields || [])[0];
        const fld = field ? fieldMap.get(field.field_id) : null;
        let distance = null;
        if (fld && fld.centroid_lat && operator_lat) {
          distance = haversine(operator_lat, operator_lng, fld.centroid_lat, fld.centroid_lng);
        }
        return {
          id: j.id,
          display_id: j.display_id,
          title: j.title,
          operation_type: j.operation_type,
          total_acres: j.total_acres,
          urgency: j.urgency,
          estimated_total: j.estimated_total,
          deadline: j.deadline,
          field_name: fld?.name || "Unknown",
          distance_miles: distance ? Math.round(distance * 10) / 10 : null,
        };
      });

      const prompt = `You are a job recommendation engine for agricultural operators.

Operator service types: ${(service_types || []).join(", ")}
Operator max travel: ${max_distance || 100} miles
Operator location: ${operator_lat}, ${operator_lng}

Available jobs:
${JSON.stringify(jobSummaries, null, 2)}

Rank the top 5 most suitable jobs for this operator. For each, provide:
- job_id: string
- score: number 0-100
- reasons: string[] (2-3 short explanations like "12 miles away", "matches spray equipment", "fits existing route")

Return a JSON object with a single key "recommendations" containing an array of these objects. Only return JSON.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are an agricultural job matching AI. Return only valid JSON." },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Credits exhausted" }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI returned ${response.status}`);
      }

      const aiData = await response.json();
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in AI response");

      const result = JSON.parse(jsonMatch[0]);

      // Enrich with job data
      const enriched = (result.recommendations || []).map((rec: any) => {
        const job = jobSummaries.find((j) => j.id === rec.job_id);
        return { ...rec, job };
      }).filter((r: any) => r.job);

      return new Response(JSON.stringify({ recommendations: enriched }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Grower mode: recommend operators for a job
    const { job_id } = await req.json().catch(() => ({ job_id: null }));
    return new Response(JSON.stringify({ recommendations: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recommend error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
