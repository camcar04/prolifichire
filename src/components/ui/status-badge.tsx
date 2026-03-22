import { cn } from "@/lib/utils";
import type { JobStatus, PacketStatus, DisputeStatus, PaymentStatus } from "@/types/domain";

type BadgeStatus = JobStatus | PacketStatus | DisputeStatus | PaymentStatus | "active" | "idle" | "pending" | "restricted" | "expiring_soon" | "expired" | "pending_verification" | "overdue" | "sent" | "viewed" | "draft" | "voided" | "opened" | "under_review" | "resolved" | "open" | string;

const statusConfig: Record<string, { label: string; className: string }> = {
  // Job
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  requested: { label: "Requested", className: "bg-info/12 text-info" },
  quoted: { label: "Quoted", className: "bg-info/12 text-info" },
  accepted: { label: "Accepted", className: "bg-primary/10 text-primary" },
  scheduled: { label: "Scheduled", className: "bg-primary/10 text-primary" },
  in_progress: { label: "In Progress", className: "bg-warning/12 text-warning-foreground" },
  delayed: { label: "Delayed", className: "bg-destructive/12 text-destructive" },
  completed: { label: "Completed", className: "bg-success/12 text-success" },
  approved: { label: "Approved", className: "bg-success/12 text-success" },
  invoiced: { label: "Invoiced", className: "bg-accent/15 text-accent-foreground" },
  paid: { label: "Paid", className: "bg-success/12 text-success" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
  disputed: { label: "Disputed", className: "bg-destructive/12 text-destructive" },
  // Packet
  generating: { label: "Generating", className: "bg-info/12 text-info" },
  ready: { label: "Ready", className: "bg-success/12 text-success" },
  downloaded: { label: "Downloaded", className: "bg-primary/10 text-primary" },
  expired: { label: "Expired", className: "bg-destructive/12 text-destructive" },
  regenerating: { label: "Regenerating", className: "bg-info/12 text-info" },
  // Field
  active: { label: "Active", className: "bg-success/12 text-success" },
  idle: { label: "Idle", className: "bg-muted text-muted-foreground" },
  pending: { label: "Pending", className: "bg-warning/12 text-warning-foreground" },
  restricted: { label: "Restricted", className: "bg-destructive/12 text-destructive" },
  // Credential
  expiring_soon: { label: "Expiring Soon", className: "bg-warning/12 text-warning-foreground" },
  pending_verification: { label: "Pending Verification", className: "bg-info/12 text-info" },
  // Dispute
  opened: { label: "Opened", className: "bg-destructive/12 text-destructive" },
  under_review: { label: "Under Review", className: "bg-warning/12 text-warning-foreground" },
  resolved: { label: "Resolved", className: "bg-success/12 text-success" },
  escalated: { label: "Escalated", className: "bg-destructive/12 text-destructive" },
  // Invoice
  sent: { label: "Sent", className: "bg-info/12 text-info" },
  viewed: { label: "Viewed", className: "bg-info/12 text-info" },
  overdue: { label: "Overdue", className: "bg-destructive/12 text-destructive" },
  voided: { label: "Voided", className: "bg-muted text-muted-foreground" },
  // Payment
  processing: { label: "Processing", className: "bg-info/12 text-info" },
  failed: { label: "Failed", className: "bg-destructive/12 text-destructive" },
  refunded: { label: "Refunded", className: "bg-muted text-muted-foreground" },
};

export function StatusBadge({ status, className: extraClass }: { status: BadgeStatus; className?: string }) {
  const config = statusConfig[status] || { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap tracking-wide", config.className, extraClass)}>
      {config.label}
    </span>
  );
}

export type { BadgeStatus };
