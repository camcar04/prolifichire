import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Wrench, ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// Map operation types to required equipment categories
const JOB_EQUIPMENT_REQUIREMENTS: Record<string, Array<{ type: string; label: string; required: boolean }>> = {
  spraying: [{ type: "sprayer", label: "Sprayer", required: true }],
  fertilizing: [{ type: "fertilizer_applicator", label: "Fertilizer Applicator", required: true }, { type: "sprayer", label: "Sprayer (alt)", required: false }],
  planting: [{ type: "planter", label: "Planter", required: true }],
  harvest: [{ type: "combine", label: "Combine", required: true }],
  grain_hauling: [{ type: "semi", label: "Semi / Truck", required: true }, { type: "hopper_trailer", label: "Hopper Trailer", required: false }],
  hauling: [{ type: "semi", label: "Semi / Truck", required: true }],
  tillage: [{ type: "tillage", label: "Tillage Equipment", required: true }],
  rock_picking: [{ type: "rock_picker", label: "Rock Picker", required: false }],
  mowing: [],
  baling: [],
  scouting: [],
  soil_sampling: [],
  seeding: [{ type: "planter", label: "Planter / Seeder", required: false }],
  drainage: [],
};

interface JobEquipmentMatchProps {
  operationType: string;
  operatorProfileId?: string;
  compact?: boolean;
}

export function JobEquipmentMatch({ operationType, operatorProfileId, compact = false }: JobEquipmentMatchProps) {
  const { data: equipment = [] } = useQuery({
    queryKey: ["equipment", operatorProfileId],
    queryFn: async () => {
      const { data } = await supabase
        .from("equipment")
        .select("*")
        .eq("operator_id", operatorProfileId!);
      return data || [];
    },
    enabled: !!operatorProfileId,
  });

  const requirements = JOB_EQUIPMENT_REQUIREMENTS[operationType] || [];
  if (requirements.length === 0) {
    return compact ? null : (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Wrench size={12} /> No specific equipment required
      </div>
    );
  }

  const results = requirements.map(req => {
    const matching = equipment.filter((e: any) => e.type === req.type && e.status === "active");
    const verified = matching.find((e: any) => e.verification_status === "verified");
    const hasAny = matching.length > 0;
    return { ...req, hasEquipment: hasAny, verified: !!verified, count: matching.length };
  });

  const requiredResults = results.filter(r => r.required);
  const allMet = requiredResults.every(r => r.hasEquipment);
  const allVerified = requiredResults.every(r => r.verified);
  const hasMissing = requiredResults.some(r => !r.hasEquipment);

  if (compact) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-1.5 py-0.5",
        allVerified ? "text-success bg-success/10" :
        allMet && !allVerified ? "text-primary bg-primary/10" :
        hasMissing ? "text-destructive bg-destructive/10" :
        "text-warning bg-warning/10"
      )}>
        {allVerified ? <><ShieldCheck size={10} /> Equipment Verified</> :
         allMet ? <><Wrench size={10} /> Equipment On File</> :
         hasMissing ? <><ShieldAlert size={10} /> Missing Equipment</> :
         <><AlertTriangle size={10} /> Check Equipment</>}
      </span>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium mb-2">
        {allMet ? <Wrench size={12} className="text-success" /> : <ShieldAlert size={12} className="text-warning" />}
        {allVerified ? "Equipment Verified" : allMet ? "Equipment On File" : "Equipment Check"}
      </div>
      {results.map(r => (
        <div key={r.label} className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{r.label}{r.required ? " *" : ""}</span>
          <span className={cn("font-medium",
            r.verified ? "text-success" :
            r.hasEquipment ? "text-primary" :
            r.required ? "text-destructive" : "text-muted-foreground"
          )}>
            {r.verified ? "✓ Verified" :
             r.hasEquipment ? `On file (${r.count})` :
             r.required ? "✗ Missing" : "Not listed"}
          </span>
        </div>
      ))}
    </div>
  );
}
