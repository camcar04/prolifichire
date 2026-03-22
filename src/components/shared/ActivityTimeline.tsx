import { cn } from "@/lib/utils";
import type { AuditAction } from "@/types/domain";
import { formatRelative } from "@/lib/format";
import {
  Upload, Download, FileText, Play, CheckCircle2, AlertTriangle,
  DollarSign, Shield, MessageSquare, Star, Settings, Plus,
  XCircle, Clock, Package,
} from "lucide-react";

const actionIcons: Partial<Record<AuditAction, { icon: typeof Upload; color: string }>> = {
  field_created: { icon: Plus, color: "text-primary" },
  field_updated: { icon: Settings, color: "text-muted-foreground" },
  boundary_uploaded: { icon: Upload, color: "text-info" },
  boundary_approved: { icon: CheckCircle2, color: "text-success" },
  job_created: { icon: Plus, color: "text-primary" },
  job_quoted: { icon: FileText, color: "text-info" },
  job_accepted: { icon: CheckCircle2, color: "text-success" },
  job_scheduled: { icon: Clock, color: "text-info" },
  job_started: { icon: Play, color: "text-warning" },
  job_completed: { icon: CheckCircle2, color: "text-success" },
  job_approved: { icon: CheckCircle2, color: "text-success" },
  job_cancelled: { icon: XCircle, color: "text-destructive" },
  file_uploaded: { icon: Upload, color: "text-info" },
  file_downloaded: { icon: Download, color: "text-muted-foreground" },
  packet_generated: { icon: Package, color: "text-primary" },
  packet_downloaded: { icon: Download, color: "text-muted-foreground" },
  invoice_created: { icon: DollarSign, color: "text-warning" },
  payment_received: { icon: DollarSign, color: "text-success" },
  payout_sent: { icon: DollarSign, color: "text-success" },
  exception_raised: { icon: AlertTriangle, color: "text-destructive" },
  dispute_opened: { icon: AlertTriangle, color: "text-destructive" },
  dispute_resolved: { icon: CheckCircle2, color: "text-success" },
  permission_granted: { icon: Shield, color: "text-info" },
  credential_uploaded: { icon: Upload, color: "text-info" },
  credential_expired: { icon: AlertTriangle, color: "text-destructive" },
  message_sent: { icon: MessageSquare, color: "text-muted-foreground" },
  review_submitted: { icon: Star, color: "text-warning" },
  comment_added: { icon: MessageSquare, color: "text-muted-foreground" },
};

interface TimelineEvent {
  id: string;
  action: AuditAction;
  description: string;
  userName: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
  className?: string;
  maxItems?: number;
}

export function ActivityTimeline({ events, className, maxItems }: ActivityTimelineProps) {
  const displayed = maxItems ? events.slice(0, maxItems) : events;

  return (
    <div className={cn("space-y-0", className)}>
      {displayed.map((event, i) => {
        const config = actionIcons[event.action] || { icon: FileText, color: "text-muted-foreground" };
        const Icon = config.icon;

        return (
          <div key={event.id} className="flex gap-3 pb-4 relative group">
            {i < displayed.length - 1 && (
              <div className="absolute left-[11px] top-7 bottom-0 w-px bg-border" />
            )}
            <div className={cn("h-6 w-6 rounded-full bg-card border flex items-center justify-center shrink-0 mt-0.5", config.color)}>
              <Icon size={12} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug">{event.description}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{event.userName}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{formatRelative(event.createdAt)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
