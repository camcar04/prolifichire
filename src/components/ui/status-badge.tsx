import { cn } from "@/lib/utils";

type Status =
  | "draft" | "requested" | "quoted" | "accepted" | "scheduled"
  | "in_progress" | "delayed" | "completed" | "approved"
  | "invoiced" | "paid" | "closed";

const statusConfig: Record<Status, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  requested: { label: "Requested", className: "bg-info/15 text-info" },
  quoted: { label: "Quoted", className: "bg-info/15 text-info" },
  accepted: { label: "Accepted", className: "bg-primary/10 text-primary" },
  scheduled: { label: "Scheduled", className: "bg-primary/10 text-primary" },
  in_progress: { label: "In Progress", className: "bg-warning/15 text-warning-foreground" },
  delayed: { label: "Delayed", className: "bg-destructive/15 text-destructive" },
  completed: { label: "Completed", className: "bg-success/15 text-success" },
  approved: { label: "Approved", className: "bg-success/15 text-success" },
  invoiced: { label: "Invoiced", className: "bg-accent/15 text-accent-foreground" },
  paid: { label: "Paid", className: "bg-success/15 text-success" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground" },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status] || statusConfig.draft;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", config.className)}>
      {config.label}
    </span>
  );
}

export type { Status };
