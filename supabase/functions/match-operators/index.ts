import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { job_id } = await req.json();

    // Fetch the job
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("*, job_fields(field_id, acreage, crop)")
      .eq("id", job_id)
      .single();

    if (jobErr || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
        fieldCentroid = {
          lat: fieldData[0].centroid_lat!,
          lng: fieldData[0].centroid_lng!,
        };
      }
    }

    // Fetch all operator profiles with capabilities
    const { data: operators } = await supabase
      .from("operator_profiles")
      .select("*, operator_capabilities(*)")
      .eq("onboarding_completed", true);

    if (!operators || operators.length === 0) {
      return new Response(
        JSON.stringify({ matched: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const notifications: any[] = [];

    for (const op of operators) {
      // Skip the job requester
      if (op.user_id === job.requested_by) continue;

      // Check operation type match
      const serviceTypes: string[] = op.service_types || [];
      if (!serviceTypes.includes(job.operation_type)) continue;

      // Check distance if we have coordinates
      if (fieldCentroid && op.base_lat && op.base_lng) {
        const dist = haversineDistance(
          op.base_lat,
          op.base_lng,
          fieldCentroid.lat,
          fieldCentroid.lng
        );
        const radius = op.service_radius || 50;
        if (dist > radius) continue;
      }

      // Check acreage thresholds from capabilities
      const caps = (op.operator_capabilities || [])[0];
      if (caps) {
        if (caps.min_job_acres && job.total_acres < caps.min_job_acres) continue;
        if (caps.max_job_acres && job.total_acres > caps.max_job_acres) continue;
      }

      // Check alert rules for this operator
      const { data: rules } = await supabase
        .from("alert_rules")
        .select("*")
        .eq("user_id", op.user_id)
        .eq("rule_type", "job_match")
        .eq("is_active", true);

      // If operator has rules, check conditions
      if (rules && rules.length > 0) {
        const rule = rules[0];
        const conditions = rule.conditions as any;
        if (conditions.operation_types?.length > 0) {
          if (!conditions.operation_types.includes(job.operation_type)) continue;
        }
        if (conditions.min_acres && job.total_acres < conditions.min_acres) continue;
      }

      // Create notification
      notifications.push({
        user_id: op.user_id,
        type: "job_match",
        title: `New ${formatOpType(job.operation_type)} job available`,
        message: `${job.total_acres} acres · ${job.title || job.display_id}`,
        action_url: `/jobs/${job.id}`,
        read: false,
      });
    }

    // Insert notifications
    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }

    // Also notify the grower
    await supabase.from("notifications").insert({
      user_id: job.requested_by,
      type: "job_update",
      title: `Job ${job.display_id} posted`,
      message: `Your ${formatOpType(job.operation_type)} job is now visible to operators.`,
      action_url: `/jobs/${job.id}`,
      read: false,
    });

    return new Response(
      JSON.stringify({ matched: notifications.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function formatOpType(t: string): string {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
