import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProfileChecklistItem {
  /** Display label rendered in the checklist row. */
  label: string;
  /** Weight (0–100) contributed when complete. */
  weight: number;
  /** Whether the item is currently complete. */
  done: boolean;
  /** Where to send the user to complete this item. */
  link: string;
}

export interface ProfileScoreBreakdown {
  /** Sum of weights of completed items. */
  total: number;
  /** Ordered checklist: rendered top-to-bottom in the UI. */
  checklist: ProfileChecklistItem[];
  /** Convenience: labels of items not yet done (preserves checklist order). */
  missing: string[];
}

/**
 * Deterministic profile completion scoring — exact weights per product spec.
 *
 * GROWER (100% total):
 *   - First + last name set (10%)
 *   - Phone number set (10%)
 *   - At least one farm created (20%)
 *   - At least one field with a boundary (20%)
 *   - Organization / business name set (20%)
 *   - First job posted (20%)
 *
 * OPERATOR (100% total):
 *   - First + last name set (10%)
 *   - Phone number set (10%)
 *   - Business name set (15%)
 *   - At least one equipment record (20%)
 *   - At least one credential uploaded (20%)
 *   - Stripe Connect completed (25%)
 *
 * The calculation is atomic: all required queries run in parallel via Promise.all and the
 * score is only emitted once every input has resolved. The hook stays disabled until the
 * AuthContext profile has loaded so the checklist is stable across re-renders. React Query
 * memoizes the result by `[user.id, mode, profile-loaded]` so callers can call this hook
 * without re-computing on every render.
 */
export function useProfileScore() {
  const { user, profile, activeMode, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: ["profile-score", user?.id, activeMode, !!profile],
    enabled: !!user && !authLoading && !!profile,
    queryFn: async (): Promise<ProfileScoreBreakdown> => {
      const hasName = !!(profile?.firstName && profile?.lastName);

      // Always-needed profile fields not on AuthContext: phone + organization
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("phone, organization_id, stripe_onboarded")
        .eq("user_id", user!.id)
        .maybeSingle();
      const hasPhone = !!profileRow?.phone;

      if (activeMode === "grower") {
        // Atomic fetch of every grower input
        const [farmResp, jobResp, orgResp] = await Promise.all([
          supabase.from("farms").select("id").eq("owner_id", user!.id).limit(1),
          supabase.from("jobs").select("id", { count: "exact", head: true }).eq("requested_by", user!.id),
          profileRow?.organization_id
            ? supabase.from("organizations").select("name").eq("id", profileRow.organization_id).maybeSingle()
            : Promise.resolve({ data: null as { name: string | null } | null }),
        ]);

        const farm = farmResp.data?.[0];
        const fieldsResp = farm
          ? await supabase.from("fields").select("boundary_geojson").eq("farm_id", farm.id).limit(50)
          : { data: [] as Array<{ boundary_geojson: unknown }> };
        const hasField = (fieldsResp.data ?? []).length > 0;
        const hasBoundary = (fieldsResp.data ?? []).some((f) => f.boundary_geojson);
        const hasJobPosted = (jobResp.count ?? 0) > 0;
        const hasOrg = !!(orgResp as { data?: { name?: string | null } | null })?.data?.name;

        const checklist: ProfileChecklistItem[] = [
          { label: "Add your first and last name", weight: 10, done: hasName, link: "/settings?tab=profile" },
          { label: "Add a phone number", weight: 10, done: hasPhone, link: "/settings?tab=profile" },
          { label: "Create your first farm", weight: 20, done: !!farm, link: "/fields" },
          { label: "Add a field with a boundary", weight: 20, done: hasField && hasBoundary, link: "/fields" },
          { label: "Set your organization / business name", weight: 20, done: hasOrg, link: "/settings?tab=hirework" },
          { label: "Post your first job", weight: 20, done: hasJobPosted, link: "/jobs" },
        ];

        const total = checklist.reduce((sum, c) => sum + (c.done ? c.weight : 0), 0);
        const missing = checklist.filter((c) => !c.done).map((c) => c.label);
        return { total: Math.min(100, total), checklist, missing };
      } else {
        // Operator: fetch profile then dependent rows in parallel
        const { data: opProf } = await supabase
          .from("operator_profiles")
          .select("id, business_name")
          .eq("user_id", user!.id)
          .maybeSingle();

        const [eqResp, credsResp] = await Promise.all([
          opProf
            ? supabase.from("equipment").select("id", { count: "exact", head: true }).eq("operator_id", opProf.id)
            : Promise.resolve({ count: 0 } as { count: number | null }),
          opProf
            ? supabase.from("credentials").select("id").eq("operator_id", opProf.id).limit(1)
            : Promise.resolve({ data: [] as Array<{ id: string }> }),
        ]);

        const hasBusinessName = !!opProf?.business_name;
        const hasEquipment = (eqResp.count ?? 0) > 0;
        const hasCredential = (credsResp.data ?? []).length > 0;
        const stripeOnboarded = !!profileRow?.stripe_onboarded;

        const checklist: ProfileChecklistItem[] = [
          { label: "Add your first and last name", weight: 10, done: hasName, link: "/settings?tab=profile" },
          { label: "Add a phone number", weight: 10, done: hasPhone, link: "/settings?tab=profile" },
          { label: "Set your business name", weight: 15, done: hasBusinessName, link: "/settings?tab=dowork" },
          { label: "Add at least one equipment record", weight: 20, done: hasEquipment, link: "/settings?tab=dowork" },
          { label: "Upload at least one credential", weight: 20, done: hasCredential, link: "/settings?tab=dowork" },
          { label: "Complete Stripe Connect setup", weight: 25, done: stripeOnboarded, link: "/settings?tab=profile" },
        ];

        const total = checklist.reduce((sum, c) => sum + (c.done ? c.weight : 0), 0);
        const missing = checklist.filter((c) => !c.done).map((c) => c.label);
        return { total: Math.min(100, total), checklist, missing };
      }
    },
    staleTime: 5 * 60 * 1000,
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
