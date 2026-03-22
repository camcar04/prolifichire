import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuidanceItem {
  id: string;
  icon: React.ReactNode;
  message: string;
  link: string;
  urgency: "action" | "info" | "success";
  time?: string;
}

interface Props {
  items: GuidanceItem[];
  title?: string;
}

const urgencyDot = {
  action: "bg-warning",
  info: "bg-info",
  success: "bg-success",
};

export function ContextualGuidance({ items, title = "What's happening now" }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">{title}</h3>
      <div className="rounded-xl bg-card shadow-card divide-y overflow-hidden">
        {items.slice(0, 4).map(item => (
          <Link
            key={item.id}
            to={item.link}
            className="flex items-center gap-3 px-4 py-3 text-[13px] transition-colors hover:bg-surface-2 group"
          >
            <span className={cn("h-2 w-2 rounded-full shrink-0", urgencyDot[item.urgency])} />
            <span className="flex-1 min-w-0 text-foreground font-medium truncate">{item.message}</span>
            {item.time && (
              <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                <Clock size={9} /> {item.time}
              </span>
            )}
            <ArrowRight size={12} className="text-muted-foreground/30 shrink-0 group-hover:text-muted-foreground transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// Helper to generate guidance items from job/field data
export function buildGrowerGuidance(jobs: any[], fields: any[]): GuidanceItem[] {
  const items: GuidanceItem[] = [];

  const pendingApprovals = jobs.filter(j => j.proof_submitted && !j.proof_approved);
  pendingApprovals.forEach(j => {
    items.push({
      id: `approve-${j.id}`,
      icon: null,
      message: `Approve completed work: ${j.title}`,
      link: `/jobs/${j.id}`,
      urgency: "action",
    });
  });

  const quoted = jobs.filter(j => j.status === "quoted");
  if (quoted.length > 0) {
    items.push({
      id: "review-quotes",
      icon: null,
      message: `${quoted.length} job${quoted.length > 1 ? "s" : ""} with quotes to review`,
      link: "/jobs",
      urgency: "action",
    });
  }

  const waitingForBids = jobs.filter(j => j.status === "requested");
  if (waitingForBids.length > 0) {
    items.push({
      id: "waiting-bids",
      icon: null,
      message: `${waitingForBids.length} job${waitingForBids.length > 1 ? "s" : ""} waiting for quotes`,
      link: "/jobs",
      urgency: "info",
    });
  }

  const inProgress = jobs.filter(j => j.status === "in_progress");
  if (inProgress.length > 0) {
    items.push({
      id: "in-progress",
      icon: null,
      message: `${inProgress.length} job${inProgress.length > 1 ? "s" : ""} in progress`,
      link: "/jobs",
      urgency: "success",
    });
  }

  const fieldsNeedingAction = fields.filter(f => f.status === "pending" || f.status === "restricted");
  if (fieldsNeedingAction.length > 0) {
    items.push({
      id: "fields-action",
      icon: null,
      message: `${fieldsNeedingAction.length} field${fieldsNeedingAction.length > 1 ? "s" : ""} need attention`,
      link: "/fields",
      urgency: "action",
    });
  }

  return items;
}

export function buildOperatorGuidance(myJobs: any[], jobsToQuote: any[]): GuidanceItem[] {
  const items: GuidanceItem[] = [];

  const needsProof = myJobs.filter(j => j.status === "in_progress" && !j.proof_submitted);
  needsProof.forEach(j => {
    items.push({
      id: `proof-${j.id}`,
      icon: null,
      message: `Submit proof of work: ${j.title}`,
      link: `/jobs/${j.id}`,
      urgency: "action",
    });
  });

  const packetsReady = myJobs.filter(j => j.status === "accepted" || j.status === "scheduled");
  if (packetsReady.length > 0) {
    items.push({
      id: "review-packets",
      icon: null,
      message: `${packetsReady.length} packet${packetsReady.length > 1 ? "s" : ""} ready — review before starting`,
      link: "/packets",
      urgency: "info",
    });
  }

  if (jobsToQuote.length > 0) {
    items.push({
      id: "new-jobs",
      icon: null,
      message: `${jobsToQuote.length} new job${jobsToQuote.length > 1 ? "s" : ""} available in your area`,
      link: "/marketplace",
      urgency: "success",
    });
  }

  return items;
}
