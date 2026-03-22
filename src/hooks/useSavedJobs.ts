import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useSavedJobs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["saved-jobs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_jobs")
        .select("job_id, saved_at")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data || []).map(r => r.job_id));
    },
  });
}

export function useSavedJobIds(): Set<string> {
  const { data } = useSavedJobs();
  return data || new Set();
}

export function useToggleSaveJob() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, isSaved }: { jobId: string; isSaved: boolean }) => {
      if (isSaved) {
        const { error } = await supabase
          .from("saved_jobs")
          .delete()
          .eq("user_id", user!.id)
          .eq("job_id", jobId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saved_jobs")
          .insert({ user_id: user!.id, job_id: jobId });
        if (error) throw error;
      }
    },
    onSuccess: (_, { isSaved }) => {
      toast.success(isSaved ? "Removed from bid queue" : "Saved to bid queue");
      qc.invalidateQueries({ queryKey: ["saved-jobs"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useSavedJobsList() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["saved-jobs-list", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_jobs")
        .select(`
          *,
          jobs(*, job_fields(*, fields(name, crop, acreage, centroid_lat, centroid_lng)), farms(name))
        `)
        .eq("user_id", user!.id)
        .order("saved_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}
