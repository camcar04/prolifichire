import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
      "rounded-xl p-5 flex items-center gap-4 animate-fade-in",
      isOperator
        ? "bg-primary text-primary-foreground"
        : "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/15"
    )}>
      <div className={cn(
        "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
        isOperator ? "bg-white/15" : "bg-primary/10"
      )}>
        <span className={isOperator ? "text-primary-foreground" : "text-primary"}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h2 className={cn(
          "text-base font-bold leading-tight",
          isOperator ? "text-primary-foreground" : "text-foreground"
        )}>{headline}</h2>
        <p className={cn(
          "text-xs mt-0.5",
          isOperator ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>{subline}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
        <Button
          size="sm"
          className={cn(
            "h-9 text-xs font-semibold gap-1.5",
            isOperator && "bg-white text-primary hover:bg-white/90"
          )}
          variant={isOperator ? "secondary" : "default"}
          asChild
        >
          <Link to={to}>{cta}</Link>
        </Button>
        {secondary && (
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-9 text-xs",
              isOperator ? "text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground" : "text-muted-foreground"
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
