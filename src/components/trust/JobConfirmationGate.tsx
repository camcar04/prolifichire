import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface JobConfirmationGateProps {
  confirmed: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
  className?: string;
}

export function JobConfirmationGate({ confirmed, onConfirmedChange, className }: JobConfirmationGateProps) {
  return (
    <div className={cn(
      "rounded border p-3 transition-colors",
      confirmed
        ? "bg-primary/4 border-primary/20"
        : "bg-amber-50/50 border-amber-200/60",
      className,
    )}>
      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <Checkbox
          checked={confirmed}
          onCheckedChange={(v) => onConfirmedChange(v === true)}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold leading-tight flex items-center gap-1.5">
            {confirmed
              ? <><ShieldCheck size={12} className="text-primary shrink-0" /> Confirmed — this is a real job</>
              : <><AlertTriangle size={12} className="text-amber-600 shrink-0" /> Confirm this is a real job</>
            }
          </p>
          <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
            I confirm this is a genuine job posting and I am prepared to hire for it.
            Fake or test postings are not allowed and may result in account restrictions.
          </p>
        </div>
      </label>
    </div>
  );
}
