import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useJobs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["jobs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          job_fields(*, fields(name, crop, acreage, centroid_lat, centroid_lng)),
          farms(name)
        `)
        .eq("requested_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useJob(jobId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["job", jobId],
    enabled: !!user && !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          job_fields(*, fields(name, crop, acreage, centroid_lat, centroid_lng, bbox_north, bbox_south, bbox_east, bbox_west, boundary_geojson)),
          farms(name),
          job_inputs(*),
          operation_specs(*),
          job_exceptions(*),
          field_packets(*, field_packet_files(*)),
          contracts(*, contract_signatures(*)),
          invoices(*, invoice_line_items(*))
        `)
        .eq("id", jobId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useJobsByField(fieldId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["jobs-by-field", fieldId],
    enabled: !!user && !!fieldId,
    queryFn: async () => {
      const { data: jobFieldRows, error: jfErr } = await supabase
        .from("job_fields")
        .select("job_id")
        .eq("field_id", fieldId!);
      if (jfErr) throw jfErr;
      if (!jobFieldRows?.length) return [];

      const jobIds = jobFieldRows.map(r => r.job_id);
      const { data, error } = await supabase
        .from("jobs")
        .select("*, job_fields(*, fields(name, crop, acreage))")
        .in("id", jobIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useMarketplaceJobs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["marketplace-jobs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          job_fields(*, fields(name, crop, acreage, centroid_lat, centroid_lng, county, state, boundary_geojson, bbox_north, bbox_south, bbox_east, bbox_west)),
          farms(name)
        `)
        .in("status", ["requested", "quoted", "scheduled"])
        .in("visibility", ["public", "network_only"])
        .neq("contract_mode", "invite_only")
        .neq("requested_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Filter out own jobs client-side (RLS already shows them)
      return (data || []).filter(j => j.requested_by !== user!.id);
    },
  });
}

export function useMyBidQueue() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-quotes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select(`
          *,
          jobs(*, job_fields(*, fields(name, crop, acreage, centroid_lat, centroid_lng)), farms(name))
        `)
        .eq("operator_id", user!.id)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useQuotesReceived() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["quotes-received", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get jobs posted by this user, then get quotes on those jobs
      const { data: myJobs } = await supabase
        .from("jobs")
        .select("id")
        .eq("requested_by", user!.id);
      if (!myJobs || myJobs.length === 0) return [];

      const jobIds = myJobs.map(j => j.id);
      const { data, error } = await supabase
        .from("quotes")
        .select(`
          *,
          jobs(id, title, operation_type, total_acres, base_rate, estimated_total, pricing_model, contract_mode,
            job_fields(*, fields(name, crop, acreage)))
        `)
        .in("job_id", jobIds)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}
