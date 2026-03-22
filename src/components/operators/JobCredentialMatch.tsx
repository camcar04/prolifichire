import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

// Define which operation types require which credential types
const JOB_CREDENTIAL_REQUIREMENTS: Record<string, Array<{ type: string; label: string; required: boolean }>> = {
  grain_hauling: [
    { type: "cdl", label: "CDL", required: true },
    { type: "insurance", label: "Insurance", required: true },
  ],
  hauling: [
    { type: "cdl", label: "CDL", required: true },
    { type: "insurance", label: "Insurance", required: true },
  ],
  spraying: [
    { type: "license", label: "Applicator License", required: true },
    { type: "insurance", label: "Insurance", required: true },
  ],
  fertilizing: [
    { type: "license", label: "Applicator License", required: true },
    { type: "insurance", label: "Insurance", required: true },
  ],
  planting: [
    { type: "insurance", label: "Insurance", required: false },
  ],
  harvest: [
    { type: "insurance", label: "Insurance", required: false },
  ],
  tillage: [
    { type: "insurance", label: "Insurance", required: false },
  ],
  mowing: [
    { type: "insurance", label: "Insurance", required: false },
  ],
  baling: [
    { type: "insurance", label: "Insurance", required: false },
  ],
  rock_picking: [],
};

interface JobCredentialMatchProps {
  operationType: string;
  operatorProfileId?: string;
  compact?: boolean;
}

export function JobCredentialMatch({ operationType, operatorProfileId, compact = false }: JobCredentialMatchProps) {
  const { data: credentials = [] } = useQuery({
    queryKey: ["credentials", operatorProfileId],
    queryFn: async () => {
      const { data } = await supabase
        .from("credentials")
        .select("*")
        .eq("operator_id", operatorProfileId!);
      return data || [];
    },
    enabled: !!operatorProfileId,
  });

  const requirements = JOB_CREDENTIAL_REQUIREMENTS[operationType] || [];
  if (requirements.length === 0) {
    return compact ? null : (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck size={12} /> No special credentials required
      </div>
    );
  }

  const now = new Date();
  const results = requirements.map(req => {
    const matching = credentials.filter((c: any) => {
      if (req.type === "cdl") return c.name?.toLowerCase().includes("cdl");
      return c.type === req.type;
    });
    const verified = matching.find((c: any) => c.is_verified && c.status === "verified" && (!c.expires_at || new Date(c.expires_at) > now));
    const expiring = matching.find((c: any) => {
      if (!c.expires_at || !c.is_verified) return false;
      const days = (new Date(c.expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return days > 0 && days < 30;
    });
    return { ...req, verified: !!verified, expiring: !!expiring };
  });

  const allMet = results.filter(r => r.required).every(r => r.verified);
  const hasMissing = results.some(r => r.required && !r.verified);
  const hasExpiring = results.some(r => r.expiring);

  if (compact) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-1.5 py-0.5",
        allMet && !hasExpiring ? "text-success bg-success/10" :
        hasMissing ? "text-destructive bg-destructive/10" :
        "text-warning bg-warning/10"
      )}>
        {allMet && !hasExpiring ? <><ShieldCheck size={10} /> Qualified</> :
         hasMissing ? <><ShieldAlert size={10} /> Missing credentials</> :
         <><AlertTriangle size={10} /> Expiring</>}
      </span>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium mb-2">
        {allMet ? <ShieldCheck size={12} className="text-success" /> : <ShieldAlert size={12} className="text-warning" />}
        {allMet ? "Fully Qualified" : "Credential Check"}
      </div>
      {results.map(r => (
        <div key={r.label} className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{r.label}{r.required ? " *" : ""}</span>
          <span className={cn("font-medium",
            r.verified && !r.expiring ? "text-success" :
            r.verified && r.expiring ? "text-warning" :
            r.required ? "text-destructive" : "text-muted-foreground"
          )}>
            {r.verified && !r.expiring ? "✓ Verified" :
             r.verified && r.expiring ? "⚠ Expiring" :
             r.required ? "✗ Missing" : "Not provided"}
          </span>
        </div>
      ))}
    </div>
  );
}
