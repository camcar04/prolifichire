import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
}

export function StatCard({ label, value, change, changeType = "neutral", icon }: StatCardProps) {
  return (
    <div className="rounded-lg bg-card px-4 py-3.5 shadow-card">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        {icon && (
          <div className="h-7 w-7 rounded-md bg-primary/6 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
      </div>
      <p className="text-xl font-bold tabular leading-none">{value}</p>
      {change && (
        <p className={cn(
          "text-[11px] mt-1.5 font-medium tabular",
          changeType === "positive" && "text-success",
          changeType === "negative" && "text-destructive",
          changeType === "neutral" && "text-muted-foreground"
        )}>
          {change}
        </p>
      )}
    </div>
  );
}
