import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { estimateJobCost, PricingProfile } from "./useOperatorPricing";

export interface JobActuals {
  id: string;
  job_id: string;
  operator_id: string;
  actual_hours: number;
  actual_travel_miles: number;
  actual_acres: number;
  actual_loads: number;
  actual_fuel_cost: number;
  actual_labor_cost: number;
  actual_equipment_cost: number;
  actual_other_cost: number;
  actual_total_cost: number;
  notes: string | null;
}

export interface ProfitReview {
  quoted: number;
  payout: number;
  estimatedCost: number;
  actualCost: number;
  estimatedProfit: number;
  actualProfit: number;
  estimatedMargin: number;
  actualMargin: number;
  verdict: "beat_estimate" | "close" | "missed";
}

export function useJobActuals(jobId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["job-actuals", jobId, user?.id],
    enabled: !!jobId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_actuals" as any)
        .select("*")
        .eq("job_id", jobId!)
        .eq("operator_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown) as JobActuals | null;
    },
  });
}

export function useSaveJobActuals() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: { jobId: string; actuals: Partial<JobActuals> }) => {
      const totalCost =
        Number(params.actuals.actual_fuel_cost || 0) +
        Number(params.actuals.actual_labor_cost || 0) +
        Number(params.actuals.actual_equipment_cost || 0) +
        Number(params.actuals.actual_other_cost || 0);

      const payload = {
        ...params.actuals,
        job_id: params.jobId,
        operator_id: user!.id,
        actual_total_cost: totalCost,
        updated_at: new Date().toISOString(),
      };

      // Check existing
      const { data: existing } = await supabase
        .from("job_actuals" as any)
        .select("id")
        .eq("job_id", params.jobId)
        .eq("operator_id", user!.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("job_actuals" as any)
          .update(payload)
          .eq("id", (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("job_actuals" as any)
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_, params) => {
      qc.invalidateQueries({ queryKey: ["job-actuals", params.jobId] });
      qc.invalidateQueries({ queryKey: ["all-job-actuals"] });
    },
  });
}

export function useAllJobActuals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["all-job-actuals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_actuals" as any)
        .select("*")
        .eq("operator_id", user!.id);
      if (error) throw error;
      return (data as unknown) as JobActuals[];
    },
  });
}

export function computeProfitReview(
  job: any,
  actuals: JobActuals | null,
  pricingProfile: PricingProfile | null
): ProfitReview | null {
  if (!actuals) return null;

  const payout = Number(job.paid_total || job.approved_total || job.estimated_total || 0);
  const quoted = Number(job.estimated_total || 0);
  const actualCost = actuals.actual_total_cost;

  const estimate = estimateJobCost(job, pricingProfile);
  const estimatedCost = estimate?.internalCost || 0;

  const estimatedProfit = quoted - estimatedCost;
  const actualProfit = payout - actualCost;
  const estimatedMargin = quoted > 0 ? (estimatedProfit / quoted) * 100 : 0;
  const actualMargin = payout > 0 ? (actualProfit / payout) * 100 : 0;

  let verdict: ProfitReview["verdict"] = "close";
  if (actualMargin > estimatedMargin + 5) verdict = "beat_estimate";
  else if (actualMargin < estimatedMargin - 10) verdict = "missed";

  return {
    quoted: Math.round(quoted * 100) / 100,
    payout: Math.round(payout * 100) / 100,
    estimatedCost: Math.round(estimatedCost * 100) / 100,
    actualCost: Math.round(actualCost * 100) / 100,
    estimatedProfit: Math.round(estimatedProfit * 100) / 100,
    actualProfit: Math.round(actualProfit * 100) / 100,
    estimatedMargin: Math.round(estimatedMargin * 10) / 10,
    actualMargin: Math.round(actualMargin * 10) / 10,
    verdict,
  };
}

export function computeServiceInsights(
  jobs: any[],
  allActuals: JobActuals[]
): { serviceType: string; jobCount: number; avgMargin: number; totalRevenue: number; totalCost: number }[] {
  const byService: Record<string, { revenue: number; cost: number; count: number }> = {};

  for (const actuals of allActuals) {
    const job = jobs.find((j) => j.id === actuals.job_id);
    if (!job) continue;
    const svc = job.operation_type || "other";
    if (!byService[svc]) byService[svc] = { revenue: 0, cost: 0, count: 0 };
    const payout = Number(job.paid_total || job.approved_total || job.estimated_total || 0);
    byService[svc].revenue += payout;
    byService[svc].cost += actuals.actual_total_cost;
    byService[svc].count += 1;
  }

  return Object.entries(byService).map(([serviceType, d]) => ({
    serviceType,
    jobCount: d.count,
    avgMargin: d.revenue > 0 ? ((d.revenue - d.cost) / d.revenue) * 100 : 0,
    totalRevenue: d.revenue,
    totalCost: d.cost,
  }));
}
