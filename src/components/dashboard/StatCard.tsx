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
    <div className="rounded-xl bg-card px-4 py-3.5 shadow-card lift group">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        {icon && (
          <div className="h-7 w-7 rounded-lg bg-primary/6 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold tabular leading-none tracking-tight">{value}</p>
      {change && (
        <p className={cn(
          "text-[11px] mt-2 font-medium tabular",
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
