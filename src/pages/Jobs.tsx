import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { useJobs } from "@/hooks/useJobs";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { CreateJobDialog } from "@/components/jobs/CreateJobDialog";
import { Briefcase, ChevronRight, Plus } from "lucide-react";
import { formatAcres, formatDate, formatOperationType } from "@/lib/format";
import { cn } from "@/lib/utils";

type FilterKey = "all" | "active" | "pending" | "invoiced" | "closed";

const ACTIVE_STATUSES = ["requested", "quoted", "accepted", "scheduled", "in_progress"];
const PENDING_STATUSES = ["completed"];
const INVOICED_STATUSES = ["invoiced", "approved", "paid"];
const CLOSED_STATUSES = ["closed", "cancelled"];

export default function Jobs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: allJobs = [], isLoading } = useJobs();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [createOpen, setCreateOpen] = useState(false);

  // Scope to jobs the current user posted
  const myJobs = useMemo(
    () => allJobs.filter((j: any) => j.requested_by === user?.id),
    [allJobs, user?.id],
  );

  const counts = useMemo(() => ({
    all: myJobs.length,
    active: myJobs.filter((j: any) => ACTIVE_STATUSES.includes(j.status)).length,
    pending: myJobs.filter((j: any) => PENDING_STATUSES.includes(j.status)).length,
    invoiced: myJobs.filter((j: any) => INVOICED_STATUSES.includes(j.status)).length,
    closed: myJobs.filter((j: any) => CLOSED_STATUSES.includes(j.status)).length,
  }), [myJobs]);

  const filteredJobs = useMemo(() => {
    switch (filter) {
      case "active": return myJobs.filter((j: any) => ACTIVE_STATUSES.includes(j.status));
      case "pending": return myJobs.filter((j: any) => PENDING_STATUSES.includes(j.status));
      case "invoiced": return myJobs.filter((j: any) => INVOICED_STATUSES.includes(j.status));
      case "closed": return myJobs.filter((j: any) => CLOSED_STATUSES.includes(j.status));
      default: return myJobs;
    }
  }, [myJobs, filter]);

  return (
    <AppShell title="Jobs">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage every job you've posted across your fields.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Post Job
          </Button>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
          <TabsList>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="active">Active ({counts.active})</TabsTrigger>
            <TabsTrigger value="pending">Pending Approval ({counts.pending})</TabsTrigger>
            <TabsTrigger value="invoiced">Invoiced ({counts.invoiced})</TabsTrigger>
            <TabsTrigger value="closed">Closed/Cancelled ({counts.closed})</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="rounded-xl border border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">
            Loading jobs…
          </div>
        ) : filteredJobs.length === 0 ? (
          filter === "all" ? (
            <EmptyState
              icon={<Briefcase className="h-6 w-6" />}
              title="No jobs yet"
              description="No jobs yet — post your first job to get started."
              action={{ label: "Post Job", onClick: () => setCreateOpen(true) }}
            />
          ) : (
            <EmptyState
              icon={<Briefcase className="h-6 w-6" />}
              title="No jobs in this view"
              description="Try switching tabs to see jobs in a different status."
            />
          )
        ) : (
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            {/* Header (desktop) */}
            <div className="hidden md:grid grid-cols-[2fr_1fr_100px_140px_140px_32px] items-center gap-4 px-5 py-3 border-b border-border/60 bg-muted/30 text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
              <div>Job</div>
              <div>Operation</div>
              <div>Acres</div>
              <div>Status</div>
              <div>Deadline</div>
              <div />
            </div>

            <ul className="divide-y divide-border/60">
              {filteredJobs.map((job: any) => {
                const fieldNames = (job.job_fields || [])
                  .map((jf: any) => jf.fields?.name)
                  .filter(Boolean);
                const isUrgent = job.urgency === "urgent" || job.urgency === "critical";
                return (
                  <li
                    key={job.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/jobs/${job.id}`);
                      }
                    }}
                    className="grid md:grid-cols-[2fr_1fr_100px_140px_140px_32px] grid-cols-1 items-center gap-2 md:gap-4 px-5 py-4 hover:bg-muted/40 cursor-pointer transition-colors focus:outline-none focus-visible:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">
                          {job.title || "Untitled job"}
                        </span>
                        {isUrgent && (
                          <Badge
                            variant="destructive"
                            className={cn(
                              "rounded-full text-[10px] px-2 py-0.5 uppercase tracking-wide",
                              job.urgency === "critical" ? "" : "bg-warning text-warning-foreground hover:bg-warning/80",
                            )}
                          >
                            {job.urgency}
                          </Badge>
                        )}
                      </div>
                      {fieldNames.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {fieldNames.join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatOperationType(job.operation_type)}
                    </div>
                    <div className="text-sm tabular-nums">
                      {formatAcres(Number(job.total_acres) || 0)}
                    </div>
                    <div>
                      <StatusBadge status={job.status} />
                    </div>
                    <div className="text-sm text-muted-foreground tabular-nums">
                      {job.deadline ? formatDate(job.deadline) : "—"}
                    </div>
                    <div className="flex justify-end text-muted-foreground">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <CreateJobDialog open={createOpen} onOpenChange={setCreateOpen} />
    </AppShell>
  );
}