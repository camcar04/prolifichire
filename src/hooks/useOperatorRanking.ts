import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RankedOperator {
  id: string;
  user_id: string;
  business_name: string;
  score: number;
  distance_miles: number | null;
  equipment_match: boolean;
  service_match: boolean;
  verified: boolean;
  profile_score: number;
  reasons: string[];
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useOperatorRanking(jobId?: string) {
  return useQuery({
    queryKey: ["operator-ranking", jobId],
    enabled: !!jobId,
    queryFn: async (): Promise<RankedOperator[]> => {
      // Fetch job details
      const { data: job } = await supabase.from("jobs").select("*, job_fields(field_id, fields(centroid_lat, centroid_lng))").eq("id", jobId!).single();
      if (!job) return [];

      const fieldLat = (job as any).job_fields?.[0]?.fields?.centroid_lat;
      const fieldLng = (job as any).job_fields?.[0]?.fields?.centroid_lng;

      // Fetch all operators
      const { data: operators } = await supabase.from("operator_profiles").select("id, user_id, business_name, base_lat, base_lng, service_radius, service_types, rating, completed_jobs");
      if (!operators) return [];

      // Fetch equipment and credentials for all
      const opIds = operators.map(o => o.id);
      const { data: allEquipment } = await supabase.from("equipment").select("operator_id, type, verification_status, variable_rate, see_and_spray").in("operator_id", opIds);
      const { data: allCreds } = await supabase.from("credentials").select("operator_id, type, is_verified").in("operator_id", opIds);

      const ranked: RankedOperator[] = operators.map(op => {
        let score = 0;
        const reasons: string[] = [];

        // Distance (max 30 pts)
        let distance: number | null = null;
        if (fieldLat && fieldLng && op.base_lat && op.base_lng) {
          distance = haversineDistance(Number(op.base_lat), Number(op.base_lng), Number(fieldLat), Number(fieldLng));
          if (distance <= 15) { score += 30; reasons.push("Very close"); }
          else if (distance <= 30) { score += 25; reasons.push("Nearby"); }
          else if (distance <= 50) { score += 15; reasons.push("Within range"); }
          else if (distance <= 100) { score += 5; }
        }

        // Service type match (20 pts)
        const serviceTypes = (op.service_types as string[]) || [];
        const serviceMatch = serviceTypes.includes(job.operation_type);
        if (serviceMatch) { score += 20; reasons.push("Service match"); }

        // Equipment match (20 pts)
        const opEquip = (allEquipment || []).filter(e => e.operator_id === op.id);
        const equipTypes: Record<string, string[]> = {
          spraying: ["sprayer"],
          planting: ["planter"],
          harvest: ["combine"],
          grain_hauling: ["semi", "truck", "hopper_trailer"],
          fertilizing: ["fertilizer_applicator", "sprayer"],
        };
        const requiredTypes = equipTypes[job.operation_type] || [];
        const equipMatch = requiredTypes.length === 0 || opEquip.some(e => requiredTypes.includes(e.type));
        if (equipMatch && requiredTypes.length > 0) { score += 20; reasons.push("Equipment match"); }

        // Verification (15 pts)
        const opCreds = (allCreds || []).filter(c => c.operator_id === op.id);
        const verifiedCreds = opCreds.filter(c => c.is_verified);
        const verifiedEquip = opEquip.filter(e => e.verification_status === "verified");
        const isVerified = verifiedCreds.length > 0 || verifiedEquip.length > 0;
        if (isVerified) { score += 15; reasons.push("Verified"); }

        // Profile completeness proxy (15 pts)
        let profileScore = 0;
        if (op.business_name) profileScore += 3;
        if (op.base_lat) profileScore += 3;
        if (op.service_radius) profileScore += 3;
        if (serviceTypes.length > 0) profileScore += 3;
        if (opEquip.length > 0) profileScore += 3;
        score += profileScore;

        return {
          id: op.id,
          user_id: op.user_id,
          business_name: op.business_name || "Unknown Operator",
          score,
          distance_miles: distance ? Math.round(distance * 10) / 10 : null,
          equipment_match: equipMatch,
          service_match: serviceMatch,
          verified: isVerified,
          profile_score: profileScore,
          reasons,
        };
      });

      return ranked.sort((a, b) => b.score - a.score);
    },
    staleTime: 60_000,
  });
}
