import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; to?: string; onClick?: () => void };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("rounded-xl bg-card border border-dashed border-border/60 p-10 text-center", className)}>
      <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground/40">
        {icon}
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">{description}</p>
      {action && (
        <div className="mt-5">
          {action.to ? (
            <Button size="sm" asChild><Link to={action.to}>{action.label}</Link></Button>
          ) : (
            <Button size="sm" onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
    </div>
  );
}
