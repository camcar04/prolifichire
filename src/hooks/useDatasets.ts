import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useDatasetsByField(fieldId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["datasets", fieldId],
    enabled: !!user && !!fieldId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dataset_assets")
        .select("*")
        .eq("field_id", fieldId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useFieldPacketsByJob(jobId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["field-packets", jobId],
    enabled: !!user && !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("field_packets")
        .select("*, field_packet_files(*)")
        .eq("job_id", jobId!)
        .order("version", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useInvoicesByField(fieldId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["invoices-field", fieldId],
    enabled: !!user && !!fieldId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("field_id", fieldId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}
