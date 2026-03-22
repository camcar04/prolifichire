import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit = 10, windowMs = 60_000): boolean {
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Authenticate caller
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
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

    // Parse input
    let body: any;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { job_id } = body;
    if (!job_id || typeof job_id !== "string" || job_id.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid job_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for cross-user queries
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller owns this job
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("*, job_fields(field_id, acreage, crop)")
      .eq("id", job_id)
      .single();

    if (jobErr || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only the job owner or admin can trigger matching
    if (job.requested_by !== user.id) {
      const { data: adminCheck } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!adminCheck) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get field centroids for distance calc
    const fieldIds = (job.job_fields || []).map((jf: any) => jf.field_id);
    let fieldCentroid: { lat: number; lng: number } | null = null;
    if (fieldIds.length > 0) {
      const { data: fieldData } = await supabase
        .from("fields")
        .select("centroid_lat, centroid_lng")
        .in("id", fieldIds)
        .not("centroid_lat", "is", null)
        .limit(1);
      if (fieldData && fieldData.length > 0) {
        fieldCentroid = { lat: fieldData[0].centroid_lat!, lng: fieldData[0].centroid_lng! };
      }
    }

    // Fetch operator profiles
    const { data: operators } = await supabase
      .from("operator_profiles")
      .select("*, operator_capabilities(*)")
      .eq("onboarding_completed", true);

    if (!operators || operators.length === 0) {
      return new Response(JSON.stringify({ matched: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const notifications: any[] = [];

    for (const op of operators) {
      if (op.user_id === job.requested_by) continue;

      const serviceTypes: string[] = op.service_types || [];
      if (!serviceTypes.includes(job.operation_type)) continue;

      if (fieldCentroid && op.base_lat && op.base_lng) {
        const dist = haversineDistance(op.base_lat, op.base_lng, fieldCentroid.lat, fieldCentroid.lng);
        const radius = op.service_radius || 50;
        if (dist > radius) continue;
      }

      const caps = (op.operator_capabilities || [])[0];
      if (caps) {
        if (caps.min_job_acres && job.total_acres < caps.min_job_acres) continue;
        if (caps.max_job_acres && job.total_acres > caps.max_job_acres) continue;
      }

      const { data: rules } = await supabase
        .from("alert_rules")
        .select("*")
        .eq("user_id", op.user_id)
        .eq("rule_type", "job_match")
        .eq("is_active", true);

      if (rules && rules.length > 0) {
        const rule = rules[0];
        const conditions = rule.conditions as any;
        if (conditions.operation_types?.length > 0) {
          if (!conditions.operation_types.includes(job.operation_type)) continue;
        }
        if (conditions.min_acres && job.total_acres < conditions.min_acres) continue;
      }

      notifications.push({
        user_id: op.user_id,
        type: "job_match",
        title: `New ${formatOpType(job.operation_type)} job available`,
        message: `${job.total_acres} acres · ${job.title || job.display_id}`,
        action_url: `/jobs/${job.id}`,
        read: false,
      });
    }

    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }

    await supabase.from("notifications").insert({
      user_id: job.requested_by,
      type: "job_update",
      title: `Job ${job.display_id} posted`,
      message: `Your ${formatOpType(job.operation_type)} job is now visible to operators.`,
      action_url: `/jobs/${job.id}`,
      read: false,
    });

    return new Response(JSON.stringify({ matched: notifications.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("match-operators error:", error);
    return new Response(JSON.stringify({ error: "Matching failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number { return (deg * Math.PI) / 180; }

function formatOpType(t: string): string {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
