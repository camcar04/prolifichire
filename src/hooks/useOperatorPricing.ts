import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PricingProfile {
  id: string;
  operator_profile_id: string;
  user_id: string;
  target_per_acre: number;
  target_per_hour: number;
  minimum_job_fee: number;
  travel_fee_per_mile: number;
  fuel_surcharge_pct: number;
  hauling_cost_per_mile: number;
  labor_cost_per_hour: number;
  desired_margin_pct: number;
  service_defaults: Record<string, { rate: number; method: string }>;
  equipment_costs: Record<string, { hourly: number; per_acre: number }>;
}

export interface JobCostEstimate {
  internalCost: number;
  breakEven: number;
  recommendedQuote: number;
  expectedProfit: number;
  marginPct: number;
  costBreakdown: {
    fieldWork: number;
    travel: number;
    fuel: number;
    labor: number;
    other: number;
  };
  verdict: "profitable" | "low_margin" | "below_target" | "counter_recommended";
}

export function useOperatorPricingProfile() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["operator-pricing-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operator_pricing_profiles" as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown) as PricingProfile | null;
    },
  });

  return query;
}

export function useSavePricingProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<PricingProfile>) => {
      // Get operator profile id
      const { data: opProfile } = await supabase
        .from("operator_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!opProfile) throw new Error("Operator profile not found. Complete operator setup first.");

      const payload = {
        ...updates,
        user_id: user!.id,
        operator_profile_id: opProfile.id,
        updated_at: new Date().toISOString(),
      };

      // Upsert
      const { data: existing } = await supabase
        .from("operator_pricing_profiles" as any)
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("operator_pricing_profiles" as any)
          .update(payload)
          .eq("id", (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("operator_pricing_profiles" as any)
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operator-pricing-profile"] });
    },
  });
}

export function estimateJobCost(
  job: any,
  profile: PricingProfile | null
): JobCostEstimate | null {
  if (!profile) return null;

  const acres = Number(job.total_acres || 0);
  const distance = Number(job.travel_distance || 0);
  const opType = job.operation_type as string;

  // Determine base rate from service defaults or global target
  const serviceDefault = profile.service_defaults?.[opType];
  let baseRatePerAcre = serviceDefault?.rate || profile.target_per_acre || 0;

  // If no rate set, use a reasonable fallback
  if (baseRatePerAcre <= 0 && profile.target_per_hour > 0) {
    // Rough estimate: assume ~15 acres/hour
    baseRatePerAcre = profile.target_per_hour / 15;
  }

  // Cost components
  const fieldWork = baseRatePerAcre * acres;
  const travel = profile.travel_fee_per_mile * distance * 2; // round trip
  const fuelSurcharge = fieldWork * (profile.fuel_surcharge_pct / 100);
  const laborHours = acres / 15; // rough estimate
  const labor = profile.labor_cost_per_hour * laborHours;

  const internalCost = fieldWork + travel + fuelSurcharge + labor;
  const minFee = Math.max(internalCost, profile.minimum_job_fee);
  const breakEven = minFee;
  const marginMultiplier = 1 + (profile.desired_margin_pct / 100);
  const recommendedQuote = Math.max(minFee * marginMultiplier, profile.minimum_job_fee);

  // Compare against posted price
  const postedTotal = Number(job.estimated_total || 0);
  const expectedProfit = postedTotal > 0 ? postedTotal - internalCost : recommendedQuote - internalCost;
  const marginPct = postedTotal > 0 && postedTotal > 0
    ? ((postedTotal - internalCost) / postedTotal) * 100
    : profile.desired_margin_pct;

  let verdict: JobCostEstimate["verdict"] = "profitable";
  if (postedTotal > 0) {
    if (postedTotal < internalCost) verdict = "counter_recommended";
    else if (marginPct < 10) verdict = "below_target";
    else if (marginPct < profile.desired_margin_pct) verdict = "low_margin";
  }

  return {
    internalCost: Math.round(internalCost * 100) / 100,
    breakEven: Math.round(breakEven * 100) / 100,
    recommendedQuote: Math.round(recommendedQuote * 100) / 100,
    expectedProfit: Math.round(expectedProfit * 100) / 100,
    marginPct: Math.round(marginPct * 10) / 10,
    costBreakdown: {
      fieldWork: Math.round(fieldWork * 100) / 100,
      travel: Math.round(travel * 100) / 100,
      fuel: Math.round(fuelSurcharge * 100) / 100,
      labor: Math.round(labor * 100) / 100,
      other: 0,
    },
    verdict,
  };
}
