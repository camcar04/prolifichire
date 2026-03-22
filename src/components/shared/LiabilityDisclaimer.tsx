import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiabilityDisclaimerProps {
  variant?: "compact" | "full";
  className?: string;
}

export function LiabilityDisclaimer({ variant = "compact", className }: LiabilityDisclaimerProps) {
  if (variant === "compact") {
    return (
      <p className={cn("text-[9px] text-muted-foreground leading-relaxed flex items-start gap-1", className)}>
        <ShieldCheck size={9} className="shrink-0 mt-0.5" />
        Users are responsible for their own licenses, insurance, and compliance. ProlificHire is a marketplace and assumes no liability for work performed.
      </p>
    );
  }

  return (
    <div className={cn("rounded-lg border bg-muted/30 p-3 space-y-1.5", className)}>
      <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
        <ShieldCheck size={10} /> Platform Disclaimer
      </p>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        ProlificHire is a marketplace platform connecting agricultural service providers with farm operations.
        All users are independently responsible for maintaining required licenses, insurance, certifications,
        and regulatory compliance. ProlificHire does not employ operators, verify credentials beyond
        self-reporting, or assume liability for work quality, crop outcomes, equipment damage, or personal injury.
        Credentials shown on profiles are self-reported unless marked as independently verified.
      </p>
    </div>
  );
}
