import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { DashboardSkeleton } from "@/components/shared/PageSkeleton";
import { Link } from "react-router-dom";
import {
  Map, Briefcase, DollarSign, TrendingUp, Plus, ArrowRight,
  AlertTriangle, Clock, CheckCircle2, Bell, FileWarning, CalendarDays,
} from "lucide-react";
import { useFields } from "@/hooks/useFields";
import { useJobs } from "@/hooks/useJobs";
import { useNotifications } from "@/hooks/useNotifications";
import { formatCurrency, formatAcres, formatOperationType, formatDateShort, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function GrowerDashboard() {
  const { data: fields = [], isLoading: fieldsLoading } = useFields();
  const { data: jobs = [], isLoading: jobsLoading } = useJobs();
  const { notifications } = useNotifications();

  const isLoading = fieldsLoading || jobsLoading;
  if (isLoading) return <DashboardSkeleton />;

  const totalAcres = fields.reduce((a, f) => a + Number(f.acreage || 0), 0);
  const activeJobs = jobs.filter(j => ["requested", "quoted", "accepted", "scheduled", "in_progress"].includes(j.status));
  const pendingApprovals = jobs.filter(j => j.proof_submitted && !j.proof_approved);
  const inProgress = jobs.filter(j => j.status === "in_progress");
  const fieldsNeedingAction = fields.filter(f => f.status === "pending" || f.status === "restricted");
  const upcomingJobs = jobs
    .filter(j => j.scheduled_start && ["scheduled", "accepted"].includes(j.status))
    .sort((a, b) => new Date(a.scheduled_start!).getTime() - new Date(b.scheduled_start!).getTime());
  const recentAlerts = notifications.filter(n => !n.read).slice(0, 6);
  const totalSpend = jobs.reduce((a, j) => a + Number(j.paid_total || 0), 0);

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
    <div className="space-y-5 animate-fade-in">
      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Active Jobs" value={String(activeJobs.length)} change={`${inProgress.length} in progress`} changeType="neutral" icon={<Briefcase size={18} />} />
        <StatCard label="Awaiting Approval" value={String(pendingApprovals.length)} changeType={pendingApprovals.length > 0 ? "negative" : "positive"} change={pendingApprovals.length > 0 ? "Action needed" : "All clear"} icon={<CheckCircle2 size={18} />} />
        <StatCard label="In Progress" value={String(inProgress.length)} change={`${formatAcres(inProgress.reduce((a, j) => a + Number(j.total_acres || 0), 0))} total`} changeType="neutral" icon={<TrendingUp size={18} />} />
        <StatCard label="Total Spend" value={formatCurrency(totalSpend)} change="Year to date" changeType="neutral" icon={<DollarSign size={18} />} />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Left — Fields needing action + Active Jobs table */}
        <div className="lg:col-span-4 space-y-5">
          {/* Fields needing action */}
          <DashPanel title="Fields Needing Action" icon={<AlertTriangle size={14} />} count={fieldsNeedingAction.length} emptyText="All fields are up to date.">
            {fieldsNeedingAction.map(f => (
              <Link key={f.id} to={`/fields/${f.id}`} className="flex items-center justify-between py-2 px-1 text-sm hover:bg-surface-2 rounded transition-colors">
                <div className="min-w-0">
                  <p className="font-medium truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{formatAcres(Number(f.acreage))}</p>
                </div>
                <StatusBadge status={f.status} />
              </Link>
            ))}
          </DashPanel>

          {/* Upcoming schedule */}
          <DashPanel title="Upcoming Schedule" icon={<CalendarDays size={14} />} count={upcomingJobs.length} emptyText="No upcoming work scheduled.">
            {upcomingJobs.slice(0, 5).map(j => {
              const jf = (j as any).job_fields?.[0];
              return (
                <Link key={j.id} to={`/jobs/${j.id}`} className="flex items-center justify-between py-2 px-1 text-sm hover:bg-surface-2 rounded transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{jf?.fields?.name || j.title}</p>
                    <p className="text-xs text-muted-foreground">{formatOperationType(j.operation_type)} · {j.scheduled_start ? formatDateShort(j.scheduled_start) : "TBD"}</p>
                  </div>
                  <StatusBadge status={j.status} />
                </Link>
              );
            })}
          </DashPanel>
        </div>

        {/* Center — Active Jobs table */}
        <div className="lg:col-span-5">
          <div className="rounded-xl bg-card shadow-card h-full flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b">
              <h2 className="text-sm font-semibold">Active Jobs</h2>
              <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                <Link to="/marketplace"><Plus size={12} className="mr-1" /> New Job</Link>
              </Button>
            </div>
            {activeJobs.length > 0 ? (
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="px-4 py-2 font-medium">Job</th>
                      <th className="px-4 py-2 font-medium hidden sm:table-cell">Type</th>
                      <th className="px-4 py-2 font-medium hidden md:table-cell">Acres</th>
                      <th className="px-4 py-2 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {activeJobs.slice(0, 8).map(job => {
                      const jf = (job as any).job_fields?.[0];
                      return (
                        <tr key={job.id} className="hover:bg-surface-2 transition-colors cursor-pointer" onClick={() => window.location.href = `/jobs/${job.id}`}>
                          <td className="px-4 py-2.5">
                            <p className="font-medium truncate max-w-[140px]">{jf?.fields?.name || job.title}</p>
                            <p className="text-[11px] text-muted-foreground">{job.display_id}</p>
                          </td>
                          <td className="px-4 py-2.5 hidden sm:table-cell text-muted-foreground">{formatOperationType(job.operation_type)}</td>
                          <td className="px-4 py-2.5 hidden md:table-cell tabular text-muted-foreground">{formatAcres(Number(job.total_acres))}</td>
                          <td className="px-4 py-2.5 text-right"><StatusBadge status={job.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <p className="text-sm text-muted-foreground">No active jobs. <Link to="/marketplace" className="text-primary hover:underline">Post a job</Link> to get started.</p>
              </div>
            )}
            {activeJobs.length > 8 && (
              <div className="px-4 py-2 border-t">
                <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" asChild>
                  <Link to="/jobs">View all {activeJobs.length} jobs <ArrowRight size={12} /></Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right — Alerts + Financial snapshot */}
        <div className="lg:col-span-3 space-y-5">
          {/* Alerts */}
          <div className="rounded-xl bg-card shadow-card">
            <div className="flex items-center gap-2 px-4 py-3 border-b">
              <Bell size={14} className="text-primary" />
              <h2 className="text-sm font-semibold">Alerts</h2>
              {recentAlerts.length > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full h-4 min-w-4 flex items-center justify-center px-1">{recentAlerts.length}</span>
              )}
            </div>
            <div className="divide-y max-h-64 overflow-auto">
              {recentAlerts.length > 0 ? recentAlerts.map(n => (
                <Link key={n.id} to={n.action_url || "/notifications"} className="block px-4 py-2.5 hover:bg-surface-2 transition-colors">
                  <p className="text-xs font-medium leading-snug line-clamp-2">{n.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatRelative(n.created_at)}</p>
                </Link>
              )) : (
                <p className="px-4 py-6 text-xs text-muted-foreground text-center">No new alerts.</p>
              )}
            </div>
            <div className="px-4 py-2 border-t">
              <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" asChild>
                <Link to="/notifications">All notifications</Link>
              </Button>
            </div>
          </div>

          {/* Financial snapshot */}
          <div className="rounded-xl bg-card shadow-card p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><DollarSign size={14} /> Financial Snapshot</h2>
            <div className="space-y-2">
              <FinRow label="Quoted" value={formatCurrency(jobs.reduce((a, j) => a + Number(j.estimated_total || 0), 0))} />
              <FinRow label="Invoiced" value={formatCurrency(jobs.reduce((a, j) => a + Number(j.invoiced_total || 0), 0))} />
              <FinRow label="Paid" value={formatCurrency(totalSpend)} accent />
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-xl bg-card shadow-card p-4">
            <h2 className="text-sm font-semibold mb-3">Quick Actions</h2>
            <div className="space-y-1.5">
              <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs" asChild>
                <Link to="/fields"><Map size={13} className="mr-2" /> Add Field</Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs" asChild>
                <Link to="/marketplace"><Briefcase size={13} className="mr-2" /> Post a Job</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Reusable sub-components ── */

function DashPanel({ title, icon, count, emptyText, children }: { title: string; icon: React.ReactNode; count: number; emptyText: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-card shadow-card">
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        {icon}
        <h2 className="text-sm font-semibold">{title}</h2>
        {count > 0 && <span className="ml-auto text-[10px] font-bold text-muted-foreground">{count}</span>}
      </div>
      <div className="px-3 py-2 max-h-56 overflow-auto">
        {count > 0 ? children : <p className="text-xs text-muted-foreground text-center py-4">{emptyText}</p>}
      </div>
    </div>
  );
}

function FinRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium tabular", accent && "text-primary")}>{value}</span>
    </div>
  );
}
