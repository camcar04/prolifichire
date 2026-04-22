import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProfileScoreBreakdown {
  total: number;
  core: number;
  functional: number;
  trust: number;
  advanced: number;
  missing: string[];
}

/**
 * Deterministic profile completion scoring.
 *
 * GROWER (100 pts total):
 *   Core (40):       Full name (15), Email (5), Farm created (10), Farm state+county (10)
 *   Functional (50): At least one field (20), Field boundary (15), Field location/centroid (15)
 *   Advanced (10):   Account base credit (10)
 *
 * OPERATOR (100 pts total):
 *   Core (35):       Full name (10), Email (5), Operator profile (5), Base location (5),
 *                    Service radius (5), Service types (5)
 *   Functional (25): At least one equipment record (25)
 *   Trust (30):      Any credential (5), Insurance (10), License/cert (10), Verified (5)
 *   Advanced (10):   Stripe Connect onboarded (10)
 *
 * The calculation is atomic: all required queries run in parallel via Promise.all and the
 * score is only emitted once every input has resolved. The hook stays disabled until the
 * AuthContext profile has loaded so `missing` items are stable across re-renders.
 */
export function useProfileScore() {
  const { user, profile, activeMode, loading: authLoading } = useAuth();

  return useQuery({
    // Profile presence is part of the key so the score recomputes once profile arrives
    // instead of caching a partial result computed against a null profile.
    queryKey: ["profile-score", user?.id, activeMode, !!profile],
    enabled: !!user && !authLoading && !!profile,
    queryFn: async (): Promise<ProfileScoreBreakdown> => {
      const missing: string[] = [];
      let core = 0, functional = 0, trust = 0, advanced = 0;

      // Core profile fields (always evaluated, never racey — read from AuthContext)
      const hasName = !!(profile?.firstName && profile?.lastName);
      const hasEmail = !!profile?.email;

      if (activeMode === "grower") {
        // Atomic fetch of every grower input
        const { data: farms } = await supabase
          .from("farms")
          .select("id, state, county")
          .eq("owner_id", user!.id)
          .limit(1);
        const farm = farms?.[0];

        const [fieldCountResp, fieldsResp] = await Promise.all([
          farm
            ? supabase.from("fields").select("id", { count: "exact", head: true }).eq("farm_id", farm.id)
            : Promise.resolve({ count: 0 } as { count: number | null }),
          farm
            ? supabase.from("fields").select("boundary_geojson, centroid_lat").eq("farm_id", farm.id).limit(10)
            : Promise.resolve({ data: [] as Array<{ boundary_geojson: unknown; centroid_lat: number | null }> }),
        ]);

        const fieldCount = fieldCountResp.count ?? 0;
        const fields = fieldsResp.data ?? [];
        const hasBoundary = fields.some(f => f.boundary_geojson);
        const hasLocation = fields.some(f => f.centroid_lat != null);

        // Score (deterministic order matches missing[] for stability)
        if (hasName) core += 15; else missing.push("Full name");
        if (hasEmail) core += 5; else missing.push("Email");
        if (farm) core += 10; else missing.push("Farm created");
        if (farm?.state && farm?.county) core += 10;
        else {
          if (!farm?.state) missing.push("Farm state");
          if (!farm?.county) missing.push("Farm county");
        }
        if (fieldCount > 0) functional += 20; else missing.push("At least one field");
        if (hasBoundary) functional += 15; else if (fieldCount > 0) missing.push("Field boundary");
        if (hasLocation) functional += 15; else if (fieldCount > 0) missing.push("Field location");
        advanced += 10; // base account credit
      } else {
        // Operator: fetch profile then dependent rows in parallel
        const { data: opProf } = await supabase
          .from("operator_profiles")
          .select("id, base_lat, base_lng, service_radius, service_types")
          .eq("user_id", user!.id)
          .maybeSingle();

        const [{ count: eqCount }, { data: creds }, { data: payProf }] = await Promise.all([
          opProf
            ? supabase.from("equipment").select("id", { count: "exact", head: true }).eq("operator_id", opProf.id)
            : Promise.resolve({ count: 0 } as { count: number | null }),
          opProf
            ? supabase.from("credentials").select("type, is_verified").eq("operator_id", opProf.id)
            : Promise.resolve({ data: [] as Array<{ type: string; is_verified: boolean | null }> }),
          supabase
            .from("profiles")
            .select("stripe_onboarded")
            .eq("user_id", user!.id)
            .maybeSingle(),
        ]);

        const credList = creds ?? [];
        const hasInsurance = credList.some(c => c.type === "insurance");
        const hasLicense = credList.some(c => c.type === "license" || c.type === "certification");
        const hasVerified = credList.some(c => c.is_verified);
        const stripeOnboarded = !!(payProf as { stripe_onboarded?: boolean | null } | null)?.stripe_onboarded;

        if (hasName) core += 10; else missing.push("Full name");
        if (hasEmail) core += 5; else missing.push("Email");
        if (opProf) core += 5; else missing.push("Operator profile");
        if (opProf?.base_lat && opProf?.base_lng) core += 5; else missing.push("Base location");
        if (opProf?.service_radius) core += 5; else missing.push("Service radius");
        if (opProf?.service_types && (opProf.service_types as string[]).length > 0) core += 5;
        else missing.push("Service types");

        if ((eqCount ?? 0) > 0) functional += 25; else missing.push("At least one equipment record");

        if (credList.length > 0) trust += 5; else missing.push("Credentials (insurance, license)");
        if (hasInsurance) trust += 10; else if (credList.length > 0) missing.push("Insurance documentation");
        if (hasLicense) trust += 10; else if (credList.length > 0) missing.push("License or certification");
        if (hasVerified) trust += 5;

        if (stripeOnboarded) advanced += 10; else missing.push("Stripe Connect");
      }

      const total = Math.min(100, core + functional + trust + advanced);
      return { total, core, functional, trust, advanced, missing };
    },
    staleTime: 5 * 60 * 1000,
    // Keep the previous score visible while a recompute is in flight so the UI doesn't flash
    placeholderData: (prev) => prev,
  });
}

export function useCanPostJob() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["can-post-job", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: farms } = await supabase.from("farms").select("id").eq("owner_id", user!.id).limit(1);
      if (!farms || farms.length === 0) return { allowed: false, reason: "Create a farm before posting jobs" };
      const { count } = await supabase.from("fields").select("id", { count: "exact", head: true }).eq("farm_id", farms[0].id);
      if (!count || count === 0) return { allowed: false, reason: "Add at least one field before posting jobs" };
      return { allowed: true, reason: null };
    },
  });
}

export function useCanBidOnJobs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["can-bid-jobs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: op } = await supabase.from("operator_profiles").select("id, service_radius, service_types, base_lat").eq("user_id", user!.id).single();
      if (!op) return { allowed: false, reason: "Complete your operator profile first" };
      if (!op.base_lat) return { allowed: false, reason: "Set your base location to find nearby jobs" };
      if (!op.service_radius) return { allowed: false, reason: "Set your service radius" };
      if (!op.service_types || (op.service_types as string[]).length === 0) return { allowed: false, reason: "Select at least one service type" };
      const { count } = await supabase.from("equipment").select("id", { count: "exact", head: true }).eq("operator_id", op.id);
      if (!count || count === 0) return { allowed: false, reason: "Add at least one equipment record" };
      return { allowed: true, reason: null };
    },
  });
}
