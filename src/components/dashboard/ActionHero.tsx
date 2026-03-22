import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionHeroProps {
  icon: React.ReactNode;
  headline: string;
  subline: string;
  cta: string;
  to: string;
  variant?: "grower" | "operator";
  secondary?: { label: string; to: string };
}

export function ActionHero({ icon, headline, subline, cta, to, variant = "grower", secondary }: ActionHeroProps) {
  const isOperator = variant === "operator";

  return (
    <div className={cn(
      "rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-in",
      isOperator
        ? "bg-primary text-primary-foreground shadow-elevated"
        : "bg-card border shadow-card"
    )}>
      <div className={cn(
        "h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
        isOperator ? "bg-white/12" : "bg-primary/8"
      )}>
        <span className={isOperator ? "text-primary-foreground" : "text-primary"}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h2 className={cn(
          "text-[15px] sm:text-base font-bold leading-snug tracking-tight",
          isOperator ? "text-primary-foreground" : "text-foreground"
        )}>{headline}</h2>
        <p className={cn(
          "text-[13px] mt-0.5 leading-relaxed",
          isOperator ? "text-primary-foreground/65" : "text-muted-foreground"
        )}>{subline}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          className={cn(
            "h-9 px-4 text-[13px] font-semibold gap-1.5",
            isOperator && "bg-white text-primary hover:bg-white/90 shadow-sm"
          )}
          variant={isOperator ? "secondary" : "default"}
          asChild
        >
          <Link to={to}>{cta} <ArrowRight size={13} /></Link>
        </Button>
        {secondary && (
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-9 text-[13px]",
              isOperator ? "text-primary-foreground/70 hover:bg-white/8 hover:text-primary-foreground" : "text-muted-foreground"
            )}
            asChild
          >
            <Link to={secondary.to}>{secondary.label}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
