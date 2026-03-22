import { CheckCircle2, Circle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
  warning?: boolean;
}

interface Props {
  job: any;
  packets: any[];
}

export function ExecutionChecklist({ job, packets }: Props) {
  const packet = packets[0];
  const hasFiles = packet?.field_packet_files?.filter((f: any) => f.included)?.length > 0;
  const hasMissing = packet?.missing_required?.length > 0;
  const hasLocation = !!(job as any).job_fields?.[0]?.fields?.centroid_lat;

  const items: ChecklistItem[] = [
    { key: "packet", label: "Packet generated", done: !!packet },
    { key: "location", label: "Field location confirmed", done: hasLocation, warning: !hasLocation },
    { key: "files", label: "Files available", done: hasFiles },
    { key: "missing", label: "No missing requirements", done: !hasMissing, warning: hasMissing },
    { key: "started", label: "Work started", done: ["in_progress"].includes(job.status) },
    { key: "proof", label: "Proof of work submitted", done: !!job.proof_submitted },
    { key: "approved", label: "Work approved", done: !!job.proof_approved },
  ];

  const completed = items.filter(i => i.done).length;

  return (
    <div className="rounded border bg-card">
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Execution Checklist
        </p>
        <span className="text-[10px] tabular-nums text-muted-foreground">{completed}/{items.length}</span>
      </div>
      <div className="p-2">
        {items.map(item => (
          <div key={item.key} className="flex items-center gap-2 py-1.5 px-1">
            {item.done ? (
              <CheckCircle2 size={13} className="text-primary shrink-0" />
            ) : item.warning ? (
              <AlertTriangle size={13} className="text-warning shrink-0" />
            ) : (
              <Circle size={13} className="text-muted-foreground/30 shrink-0" />
            )}
            <span className={cn(
              "text-[11px]",
              item.done ? "text-foreground" : "text-muted-foreground"
            )}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
