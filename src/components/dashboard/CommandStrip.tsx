import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandStripProps {
  icon: React.ReactNode;
  label: string;
  detail?: string;
  cta: string;
  to?: string;
  onClick?: () => void;
  urgency?: "action" | "info" | "neutral";
  secondary?: { label: string; to: string };
}

const urgencyStyles = {
  action: "border-l-warning bg-warning/5",
  info: "border-l-primary bg-primary/3",
  neutral: "border-l-border bg-surface-2/50",
};

export function CommandStrip({ icon, label, detail, cta, to, urgency = "neutral", secondary }: CommandStripProps) {
  return (
    <div className={cn(
      "flex items-center gap-3 px-3 py-2 border-l-[3px] rounded-r transition-colors",
      urgencyStyles[urgency]
    )}>
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold leading-tight truncate">{label}</p>
        {detail && <p className="text-[11px] text-muted-foreground mt-0.5">{detail}</p>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {secondary && (
          <Button variant="ghost" size="sm" className="h-7 text-[11px] text-muted-foreground px-2" asChild>
            <Link to={secondary.to}>{secondary.label}</Link>
          </Button>
        )}
        <Button size="sm" className="h-7 text-[11px] gap-1 px-3" asChild>
          <Link to={to}>{cta} <ArrowRight size={10} /></Link>
        </Button>
      </div>
    </div>
  );
}
