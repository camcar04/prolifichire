import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface JobTemplate {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  operation_type: string;
  crop: string;
  pricing_model: string;
  base_rate: number;
  urgency: string;
  spec_data: Record<string, any>;
  required_files: string[];
  contract_defaults: Record<string, any>;
  comm_defaults: Record<string, any>;
  notes: string | null;
  requirements: string | null;
  is_shared: boolean;
  use_count: number;
  created_at: string;
  updated_at: string;
}

export function useJobTemplates() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["job-templates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_templates")
        .select("*")
        .order("use_count", { ascending: false });
      if (error) throw error;
      return (data || []) as JobTemplate[];
    },
    enabled: !!user,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (template: Omit<JobTemplate, "id" | "owner_id" | "use_count" | "created_at" | "updated_at">) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("job_templates")
        .insert({ ...template, owner_id: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as JobTemplate;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-templates"] });
      toast.success("Template saved");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("job_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-templates"] });
      toast.success("Template deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useIncrementTemplateUse() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Read current count, then update
      const { data } = await supabase.from("job_templates").select("use_count").eq("id", id).single();
      const newCount = ((data as any)?.use_count || 0) + 1;
      const { error } = await supabase.from("job_templates").update({ use_count: newCount } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["job-templates"] }),
  });
}
