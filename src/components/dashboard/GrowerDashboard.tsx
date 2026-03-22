import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { DashboardSkeleton } from "@/components/shared/PageSkeleton";
// Hire Work Dashboard (Grower / Landowner)
import { Map, Briefcase, DollarSign, TrendingUp, Plus, ArrowRight, AlertTriangle, Clock, CheckCircle2, Bell } from "lucide-react";
import { useFields } from "@/hooks/useFields";
import { useJobs } from "@/hooks/useJobs";
import { useNotifications } from "@/hooks/useNotifications";
import { formatCurrency, formatAcres, formatOperationType } from "@/lib/format";
import { formatDistanceToNow } from "date-fns";

export default function GrowerDashboard() {
  const { data: fields = [], isLoading: fieldsLoading } = useFields();
  const { data: jobs = [], isLoading: jobsLoading } = useJobs();
  const { notifications } = useNotifications();

  const isLoading = fieldsLoading || jobsLoading;

  if (isLoading) return <DashboardSkeleton />;

  const totalAcres = fields.reduce((a, f) => a + Number(f.acreage || 0), 0);
  const activeJobs = jobs.filter(j => ["requested", "quoted", "accepted", "scheduled", "in_progress"].includes(j.status));
  const pendingApprovals = jobs.filter(j => j.proof_submitted && !j.proof_approved);
  const fieldsNeedingAction = fields.filter(f => f.status === "pending" || f.status === "restricted");
  const upcomingJobs = jobs.filter(j => j.scheduled_start && ["scheduled", "accepted"].includes(j.status));
  const recentJobs = jobs.slice(0, 6);
  const recentAlerts = notifications.filter(n => !n.read).slice(0, 5);

  if (fields.length === 0 && jobs.length === 0) {
    return (
      <EmptyState
        icon={<Map size={24} />}
        title="Welcome to ProlificHire"
        description="Start by adding your first farm and field, then post a job to the marketplace."
        action={{ label: "Add Your First Field", to: "/fields" }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Fields" value={String(fields.length)} change={`${fields.filter(f => f.status === "active").length} with active jobs`} changeType="positive" icon={<Map size={20} />} />
        <StatCard label="Open Jobs" value={String(activeJobs.length)} change={`${jobs.filter(j => j.status === "in_progress").length} in progress`} changeType="neutral" icon={<Briefcase size={20} />} />
        <StatCard label="Acres Managed" value={formatAcres(totalAcres)} change={`${fields.length} fields`} changeType="positive" icon={<TrendingUp size={20} />} />
        <StatCard label="Jobs This Year" value={String(jobs.length)} change="All statuses" changeType="neutral" icon={<DollarSign size={20} />} />
      </div>

      {(pendingApprovals.length > 0 || fieldsNeedingAction.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {pendingApprovals.length > 0 && (
            <div className="rounded-xl bg-warning/8 border border-warning/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className="text-warning" />
                <h3 className="text-sm font-semibold">{pendingApprovals.length} Approval{pendingApprovals.length > 1 ? "s" : ""} Pending</h3>
              </div>
              <div className="space-y-1.5">
                {pendingApprovals.map(j => (
                  <Link key={j.id} to={`/jobs/${j.id}`} className="flex items-center justify-between text-sm hover:underline">
                    <span>{j.display_id} — {formatOperationType(j.operation_type)}</span>
                    <ArrowRight size={14} />
                  </Link>
                ))}
              </div>
            </div>
          )}
          {fieldsNeedingAction.length > 0 && (
            <div className="rounded-xl bg-destructive/8 border border-destructive/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-destructive" />
                <h3 className="text-sm font-semibold">{fieldsNeedingAction.length} Field{fieldsNeedingAction.length > 1 ? "s" : ""} Need Attention</h3>
              </div>
              <div className="space-y-1.5">
                {fieldsNeedingAction.map(f => (
                  <Link key={f.id} to={`/fields/${f.id}`} className="flex items-center justify-between text-sm hover:underline">
                    <span>{f.name}</span>
                    <StatusBadge status={f.status} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl bg-card shadow-card">
          <div className="flex items-center justify-between p-5 border-b">
            <h2 className="font-semibold">Recent Jobs</h2>
            <Button variant="outline" size="sm" asChild>
              <Link to="/marketplace"><Plus size={14} /> New Job</Link>
            </Button>
          </div>
          {recentJobs.length > 0 ? (
            <div className="divide-y">
              {recentJobs.map(job => {
                const jf = (job as any).job_fields?.[0];
                const fieldName = jf?.fields?.name || job.title;
                return (
                  <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center justify-between p-4 hover:bg-surface-2 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{fieldName}</p>
                      <p className="text-xs text-muted-foreground">{formatOperationType(job.operation_type)} · {formatAcres(Number(job.total_acres))}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <StatusBadge status={job.status} />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">No jobs yet. Post your first job to get started.</div>
          )}
          {recentJobs.length > 0 && (
            <div className="p-3 border-t">
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground" asChild>
                <Link to="/jobs">View all jobs <ArrowRight size={14} /></Link>
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {upcomingJobs.length > 0 && (
            <div className="rounded-xl bg-card shadow-card p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><Clock size={15} /> Upcoming Work</h2>
              <div className="space-y-2.5">
                {upcomingJobs.slice(0, 3).map(j => {
                  const jf = (j as any).job_fields?.[0];
                  return (
                    <Link key={j.id} to={`/jobs/${j.id}`} className="block rounded-lg bg-surface-2 p-2.5 hover:bg-surface-3 transition-colors">
                      <p className="text-sm font-medium">{jf?.fields?.name || j.title}</p>
                      <p className="text-xs text-muted-foreground">{formatOperationType(j.operation_type)}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-xl bg-card shadow-card p-5">
            <h2 className="font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link to="/fields"><Map size={14} /> Add Field</Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link to="/marketplace"><Briefcase size={14} /> Post a Job</Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link to="/marketplace"><TrendingUp size={14} /> Browse Marketplace</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-xl bg-card shadow-card p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Bell size={15} /> Recent Activity
            </h2>
            {recentAlerts.length > 0 ? (
              <div className="space-y-2.5">
                {recentAlerts.map(n => (
                  <div key={n.id} className="rounded-lg bg-surface-2 p-2.5">
                    <p className="text-sm font-medium leading-snug">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No new activity.</p>
            )}
            <Button variant="ghost" size="sm" className="w-full mt-3 text-muted-foreground" asChild>
              <Link to="/notifications">View all notifications</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
