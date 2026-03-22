import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const CANCELLATION_REASONS = [
  { value: "no_longer_needed", label: "No longer needed" },
  { value: "weather", label: "Weather conditions" },
  { value: "field_conditions", label: "Field conditions changed" },
  { value: "operator_issue", label: "Operator issue" },
  { value: "duplicate", label: "Duplicate posting" },
  { value: "timing_changed", label: "Timing changed" },
  { value: "pricing_issue", label: "Pricing issue" },
  { value: "other", label: "Other" },
] as const;

export type CancellationReason = (typeof CANCELLATION_REASONS)[number]["value"];
export { CANCELLATION_REASONS };

export function useCancelJob(jobId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ reason, note }: { reason: CancellationReason; note?: string }) => {
      const fullReason = note ? `${reason}: ${note}` : reason;
      const { error } = await supabase
        .from("jobs")
        .update({
          status: "cancelled" as any,
          cancellation_reason: fullReason,
          cancelled_at: new Date().toISOString(),
          cancelled_by: user!.id,
        })
        .eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job", jobId] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: "Job cancelled", description: "The job has been cancelled and all parties notified." });
    },
    onError: () => {
      toast({ title: "Failed to cancel job", variant: "destructive" });
    },
  });
}

export function useEditJob(jobId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ updates, changeType }: { updates: Record<string, any>; changeType: string }) => {
      // Update the job
      const { error } = await supabase
        .from("jobs")
        .update({
          ...updates,
          last_edited_at: new Date().toISOString(),
          last_edited_by: user!.id,
        })
        .eq("id", jobId);
      if (error) throw error;

      // Record the edit in history
      const { error: histErr } = await supabase
        .from("job_edit_history")
        .insert({
          job_id: jobId,
          edited_by: user!.id,
          change_type: changeType,
          new_value: updates,
          requires_acknowledgment: false,
        });
      if (histErr) console.warn("Edit history insert failed:", histErr);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job", jobId] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: "Job updated", description: "Changes saved successfully." });
    },
    onError: () => {
      toast({ title: "Failed to update job", variant: "destructive" });
    },
  });
}

export function canCancelJob(job: any, userId: string): { allowed: boolean; requiresReason: boolean; feeWarning: boolean; blocked: boolean; blockReason?: string } {
  if (job.status === "cancelled" || job.status === "completed" || job.status === "paid") {
    return { allowed: false, requiresReason: false, feeWarning: false, blocked: true, blockReason: "Job already finished" };
  }
  if (job.requested_by !== userId) {
    return { allowed: false, requiresReason: false, feeWarning: false, blocked: true, blockReason: "Only the job owner can cancel" };
  }

  const isAccepted = !!job.operator_id;
  const now = new Date();
  const scheduled = job.scheduled_start ? new Date(job.scheduled_start) : new Date(job.deadline);
  const hoursUntil = (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60);
  const within48 = hoursUntil <= 48 && hoursUntil > 0;

  if (!isAccepted) {
    return { allowed: true, requiresReason: false, feeWarning: false, blocked: false };
  }

  return {
    allowed: true,
    requiresReason: true,
    feeWarning: within48,
    blocked: false,
    blockReason: within48 ? "Cancellation within 48 hours may incur a fee" : undefined,
  };
}

export function canEditJob(job: any, userId: string): { allowed: boolean; limitedEdit: boolean } {
  if (job.requested_by !== userId) return { allowed: false, limitedEdit: false };
  if (["cancelled", "completed", "paid"].includes(job.status)) return { allowed: false, limitedEdit: false };
  if (["in_progress"].includes(job.status)) return { allowed: true, limitedEdit: true };
  return { allowed: true, limitedEdit: false };
}
