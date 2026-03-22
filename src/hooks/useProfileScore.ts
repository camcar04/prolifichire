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

export function useProfileScore() {
  const { user, profile, activeMode } = useAuth();

  return useQuery({
    queryKey: ["profile-score", user?.id, activeMode],
    enabled: !!user,
    queryFn: async (): Promise<ProfileScoreBreakdown> => {
      const missing: string[] = [];
      let core = 0, functional = 0, trust = 0, advanced = 0;

      // Core (40 pts max)
      if (profile?.firstName && profile?.lastName) core += 10; else missing.push("Full name");
      if (profile?.email) core += 5;

      if (activeMode === "grower") {
        // Check farm + field
        const { data: farms } = await supabase.from("farms").select("id, state, county").eq("owner_id", user!.id).limit(1);
        const hasFarm = farms && farms.length > 0;
        if (hasFarm) {
          core += 10;
          if (farms[0].state) core += 5; else missing.push("Farm state");
          if (farms[0].county) core += 5; else missing.push("Farm county");
          const { count } = await supabase.from("fields").select("id", { count: "exact", head: true }).eq("farm_id", farms[0].id);
          if (count && count > 0) core += 5; else missing.push("At least one field");
        } else {
          missing.push("Farm created", "At least one field");
        }
      } else {
        // Operator core
        const { data: opProf } = await supabase.from("operator_profiles").select("id, base_lat, base_lng, service_radius, service_types").eq("user_id", user!.id).single();
        if (opProf) {
          core += 5;
          if (opProf.base_lat && opProf.base_lng) core += 10; else missing.push("Base location");
          if (opProf.service_radius) core += 5; else missing.push("Service radius");
          if (opProf.service_types && (opProf.service_types as string[]).length > 0) core += 10; else missing.push("Service types");

          // Functional (30 pts) - equipment
          const { count: eqCount } = await supabase.from("equipment").select("id", { count: "exact", head: true }).eq("operator_id", opProf.id);
          if (eqCount && eqCount > 0) functional += 30; else missing.push("At least one equipment record");

          // Trust (20 pts) - credentials
          const { data: creds } = await supabase.from("credentials").select("type, is_verified").eq("operator_id", opProf.id);
          if (creds && creds.length > 0) {
            trust += 5;
            const hasInsurance = creds.some(c => c.type === "insurance");
            const hasLicense = creds.some(c => c.type === "license" || c.type === "certification");
            const verified = creds.filter(c => c.is_verified).length;
            if (hasInsurance) trust += 5; else missing.push("Insurance documentation");
            if (hasLicense) trust += 5; else missing.push("License or certification");
            if (verified > 0) trust += 5;
          } else {
            missing.push("Credentials (insurance, license)");
          }
        } else {
          missing.push("Operator profile", "Base location", "Service radius", "Service types", "Equipment");
        }
      }

      if (activeMode === "grower") {
        // Functional for grower - having fields with boundaries
        const { data: farms } = await supabase.from("farms").select("id").eq("owner_id", user!.id).limit(1);
        if (farms?.[0]) {
          const { data: fields } = await supabase.from("fields").select("boundary_geojson, centroid_lat").eq("farm_id", farms[0].id).limit(5);
          const withBoundary = fields?.filter(f => f.boundary_geojson) || [];
          const withLocation = fields?.filter(f => f.centroid_lat) || [];
          if (withBoundary.length > 0) functional += 15; else missing.push("Field boundary");
          if (withLocation.length > 0) functional += 15; else missing.push("Field location");
        }
      }

      // Advanced (10 pts) - notification prefs, integrations
      advanced += 5; // Base for having account

      const total = Math.min(100, core + functional + trust + advanced);
      return { total, core, functional, trust, advanced, missing };
    },
    staleTime: 5 * 60 * 1000,
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
