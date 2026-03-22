import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const UPDATE_STATUSES = [
  "packet_reviewed",
  "en_route",
  "arrived",
  "starting_work",
  "delayed",
  "paused",
  "issue_encountered",
  "completed",
  "note",
] as const;

export type JobUpdateStatus = (typeof UPDATE_STATUSES)[number];

export const UPDATE_STATUS_LABELS: Record<JobUpdateStatus, string> = {
  packet_reviewed: "Packet Reviewed",
  en_route: "En Route to Field",
  arrived: "Arrived at Field",
  starting_work: "Starting Work",
  delayed: "Delayed",
  paused: "Paused",
  issue_encountered: "Issue Encountered",
  completed: "Work Completed",
  note: "Note",
};

export function useJobUpdates(jobId: string | undefined) {
  return useQuery({
    queryKey: ["job-updates", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_updates")
        .select("*")
        .eq("job_id", jobId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function usePostJobUpdate(jobId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ status, note }: { status: JobUpdateStatus; note?: string }) => {
      const { error } = await supabase.from("job_updates").insert({
        job_id: jobId,
        user_id: user!.id,
        status,
        note: note || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-updates", jobId] });
      toast({ title: "Update posted", description: "Your status update is now visible." });
    },
    onError: () => {
      toast({ title: "Failed to post update", variant: "destructive" });
    },
  });
}

export function useProofOfWork(jobId: string | undefined) {
  return useQuery({
    queryKey: ["proof-of-work", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proof_of_work")
        .select("*")
        .eq("job_id", jobId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useSubmitProof(jobId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ notes }: { notes: string }) => {
      const { error } = await supabase.from("proof_of_work").insert({
        job_id: jobId,
        submitted_by: user!.id,
        notes,
      });
      if (error) throw error;

      // Mark job proof_submitted
      await supabase.from("jobs").update({ proof_submitted: true }).eq("id", jobId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proof-of-work", jobId] });
      qc.invalidateQueries({ queryKey: ["job", jobId] });
      toast({ title: "Proof submitted", description: "Awaiting grower review." });
    },
    onError: () => {
      toast({ title: "Failed to submit proof", variant: "destructive" });
    },
  });
}
