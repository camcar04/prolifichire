import { cn } from "@/lib/utils";

interface KPIItem {
  label: string;
  value: string;
  accent?: boolean;
  sub?: string;
}

interface KPIStripProps {
  items: KPIItem[];
  className?: string;
}

export function KPIStrip({ items, className }: KPIStripProps) {
  return (
    <div className={cn("flex items-stretch divide-x overflow-x-auto", className)}>
      {items.map((item, i) => (
        <div key={i} className={cn("flex-1 min-w-0 px-4 py-2.5", i === 0 && "pl-0")}>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">{item.label}</p>
          <p className={cn(
            "text-lg font-bold tabular leading-none tracking-tight",
            item.accent ? "text-primary" : "text-foreground"
          )}>{item.value}</p>
          {item.sub && <p className="text-[10px] text-muted-foreground mt-1">{item.sub}</p>}
        </div>
      ))}
    </div>
  );
}
