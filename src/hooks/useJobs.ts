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
          job_fields(*, fields(name, crop, acreage, centroid_lat, centroid_lng, boundary_geojson)),
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
    queryKey: ["marketplace-jobs"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          job_fields(*, fields(name, crop, acreage, centroid_lat, centroid_lng)),
          farms(name)
        `)
        .in("status", ["requested", "quoted", "scheduled"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}
