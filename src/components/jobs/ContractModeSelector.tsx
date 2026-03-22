import { cn } from "@/lib/utils";
import { DollarSign, Users, Send } from "lucide-react";

export type ContractMode = "fixed_price" | "open_bidding" | "invite_only";

const MODES: { value: ContractMode; label: string; desc: string; icon: typeof DollarSign }[] = [
  { value: "fixed_price", label: "Fixed Price", desc: "Set your rate — operators accept or pass.", icon: DollarSign },
  { value: "open_bidding", label: "Get Quotes", desc: "Operators submit competing bids.", icon: Users },
  { value: "invite_only", label: "Invite Operators", desc: "Send to specific operators only.", icon: Send },
];

interface ContractModeSelectorProps {
  value: ContractMode;
  onChange: (mode: ContractMode) => void;
}

export function ContractModeSelector({ value, onChange }: ContractModeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">How do you want to hire?</label>
      <div className="grid sm:grid-cols-3 gap-2">
        {MODES.map(m => {
          const Icon = m.icon;
          const selected = value === m.value;
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => onChange(m.value)}
              className={cn(
                "rounded-lg border p-3 text-left transition-all",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/40 hover:bg-surface-2"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className={selected ? "text-primary" : "text-muted-foreground"} />
                <span className={cn("text-sm font-medium", selected && "text-primary")}>{m.label}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">{m.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function formatContractMode(mode: string): string {
  switch (mode) {
    case "fixed_price": return "Fixed Price";
    case "open_bidding": return "Open Bidding";
    case "invite_only": return "Invite Only";
    default: return mode;
  }
}
