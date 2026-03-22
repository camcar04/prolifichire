import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useLaborJobs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["labor-jobs"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labor_jobs")
        .select("*, farms(name)")
        .in("visibility", ["public", "network_only"])
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useMyLaborJobs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-labor-jobs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labor_jobs")
        .select("*, farms(name), labor_applications(id, status, worker_id)")
        .eq("posted_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useLaborApplications(laborJobId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["labor-applications", laborJobId],
    enabled: !!user && !!laborJobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labor_applications")
        .select("*, worker_profiles:worker_id(display_name, skills, years_experience, availability_status, base_city, base_state)")
        .eq("labor_job_id", laborJobId!)
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useMyApplications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-applications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labor_applications")
        .select("*, labor_jobs(title, job_type, compensation_type, compensation_min, compensation_max, location_city, location_state, status)")
        .eq("worker_id", user!.id)
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateLaborJob() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (job: {
      title: string;
      description?: string;
      responsibilities?: string;
      job_type: string;
      required_skills?: string[];
      experience_level?: string;
      location_city?: string;
      location_state?: string;
      start_date?: string;
      end_date?: string;
      hours_per_day?: number;
      schedule_flexibility?: string;
      compensation_type: string;
      compensation_min?: number;
      compensation_max?: number;
      housing_provided?: boolean;
      farm_id?: string;
    }) => {
      const { data, error } = await supabase
        .from("labor_jobs")
        .insert({ ...job, posted_by: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["labor-jobs"] });
      qc.invalidateQueries({ queryKey: ["my-labor-jobs"] });
    },
  });
}

export function useApplyToJob() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ laborJobId, coverNote }: { laborJobId: string; coverNote?: string }) => {
      const { data, error } = await supabase
        .from("labor_applications")
        .insert({ labor_job_id: laborJobId, worker_id: user!.id, cover_note: coverNote } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["labor-jobs"] });
      qc.invalidateQueries({ queryKey: ["my-applications"] });
    },
  });
}

export function useUpdateApplicationStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("labor_applications")
        .update({ status, reviewed_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["labor-applications"] });
    },
  });
}

export function useWorkerProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["worker-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worker_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertWorkerProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (profile: Record<string, any>) => {
      const { data, error } = await supabase
        .from("worker_profiles")
        .upsert({ ...profile, user_id: user!.id, updated_at: new Date().toISOString() } as any, { onConflict: "user_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["worker-profile"] });
    },
  });
}
