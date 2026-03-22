import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Trust levels based on activity
export type TrustLevel = "new" | "active" | "trusted" | "verified";

export interface PosterStats {
  total_posted: number;
  total_completed: number;
  total_cancelled: number;
  total_paid: number;
  avg_response_hours: number;
}

export function deriveTrustLevel(stats: PosterStats | null): TrustLevel {
  if (!stats) return "new";
  const { total_completed, total_cancelled, total_posted } = stats;
  if (total_completed === 0) return "new";
  const cancelRate = total_posted > 0 ? total_cancelled / total_posted : 0;
  if (total_completed >= 10 && cancelRate < 0.05) return "verified";
  if (total_completed >= 3 && cancelRate < 0.15) return "trusted";
  return "active";
}

export function usePosterStats(userId: string | undefined) {
  return useQuery({
    queryKey: ["poster-stats", userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_poster_stats", {
        _user_id: userId!,
      });
      if (error) throw error;
      return data as unknown as PosterStats;
    },
  });
}

export function useJobConfirmation(jobId: string | undefined) {
  return useQuery({
    queryKey: ["job-confirmation", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data } = await supabase
        .from("job_confirmations" as any)
        .select("*")
        .eq("job_id", jobId!)
        .maybeSingle();
      return data;
    },
  });
}

export function useConfirmJob() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("job_confirmations" as any)
        .insert({
          job_id: jobId,
          user_id: user!.id,
          user_agent: navigator.userAgent,
        } as any);
      if (error) throw error;
    },
    onSuccess: (_, jobId) => {
      qc.invalidateQueries({ queryKey: ["job-confirmation", jobId] });
    },
    onError: () => {
      toast.error("Failed to confirm job");
    },
  });
}

export function useReportJob() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      reason,
      details,
    }: {
      jobId: string;
      reason: string;
      details?: string;
    }) => {
      const { error } = await supabase
        .from("job_reports" as any)
        .insert({
          job_id: jobId,
          reported_by: user!.id,
          reason,
          details,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report submitted. Our team will review this posting.");
      qc.invalidateQueries({ queryKey: ["job-reports"] });
    },
    onError: () => {
      toast.error("Failed to submit report");
    },
  });
}

// Job quality validation
export interface JobQualityResult {
  valid: boolean;
  missing: string[];
  score: number; // 0-100
}

export function validateJobQuality(job: any): JobQualityResult {
  const missing: string[] = [];
  let score = 0;
  const total = 7;

  // Field selected
  const hasField = job.job_fields?.length > 0;
  if (hasField) score++; else missing.push("Field selection");

  // Location present
  const fieldData = job.job_fields?.[0]?.fields;
  const hasLocation = fieldData?.centroid_lat && fieldData?.centroid_lng;
  if (hasLocation) score++; else missing.push("Field location");

  // Acreage
  const hasAcreage = Number(job.total_acres) > 0;
  if (hasAcreage) score++; else missing.push("Acreage");

  // Schedule
  const hasSchedule = !!job.deadline;
  if (hasSchedule) score++; else missing.push("Schedule / deadline");

  // Operation type
  if (job.operation_type && job.operation_type !== "other") score++;
  else missing.push("Operation type");

  // Pricing
  if (Number(job.base_rate) > 0) score++;
  else missing.push("Pricing / rate");

  // Title
  if (job.title?.trim()) score++;
  else missing.push("Job title");

  return {
    valid: missing.length === 0,
    missing,
    score: Math.round((score / total) * 100),
  };
}
