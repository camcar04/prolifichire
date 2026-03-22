import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { DashboardSkeleton } from "@/components/shared/PageSkeleton";
import { FirstJobOnboarding } from "@/components/onboarding/FirstJobOnboarding";
import { Link } from "react-router-dom";
import {
  Map, Briefcase, DollarSign, TrendingUp, Plus, ArrowRight,
  AlertTriangle, CheckCircle2, Bell, CalendarDays,
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

  const activeJobs = jobs.filter(j => ["requested", "quoted", "accepted", "scheduled", "in_progress"].includes(j.status));
  const pendingApprovals = jobs.filter(j => j.proof_submitted && !j.proof_approved);
  const inProgress = jobs.filter(j => j.status === "in_progress");
  const fieldsNeedingAction = fields.filter(f => f.status === "pending" || f.status === "restricted");
  const upcomingJobs = jobs
    .filter(j => j.scheduled_start && ["scheduled", "accepted"].includes(j.status))
    .sort((a, b) => new Date(a.scheduled_start!).getTime() - new Date(b.scheduled_start!).getTime());
  const recentAlerts = notifications.filter(n => !n.read).slice(0, 5);
  const totalSpend = jobs.reduce((a, j) => a + Number(j.paid_total || 0), 0);

  // Show first-job onboarding if user has no fields and no jobs
  if (fields.length === 0 && jobs.length === 0) {
    return <FirstJobOnboarding />;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Active Jobs" value={String(activeJobs.length)} change={`${inProgress.length} in progress`} changeType="neutral" icon={<Briefcase size={15} />} />
        <StatCard label="Awaiting Approval" value={String(pendingApprovals.length)} changeType={pendingApprovals.length > 0 ? "negative" : "positive"} change={pendingApprovals.length > 0 ? "Action needed" : "All clear"} icon={<CheckCircle2 size={15} />} />
        <StatCard label="In Progress" value={String(inProgress.length)} change={`${formatAcres(inProgress.reduce((a, j) => a + Number(j.total_acres || 0), 0))} total`} changeType="neutral" icon={<TrendingUp size={15} />} />
        <StatCard label="Total Spend" value={formatCurrency(totalSpend)} change="Year to date" changeType="neutral" icon={<DollarSign size={15} />} />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-12 gap-4">
        {/* Left */}
        <div className="lg:col-span-3 space-y-4">
          <Panel title="Fields Needing Action" icon={<AlertTriangle size={13} />} count={fieldsNeedingAction.length} emptyText="All fields up to date.">
            {fieldsNeedingAction.map(f => (
              <Link key={f.id} to={`/fields/${f.id}`} className="flex items-center justify-between py-1.5 px-1 text-[13px] hover:bg-surface-2 rounded transition-colors">
                <div className="min-w-0">
                  <p className="font-medium truncate">{f.name}</p>
                  <p className="text-[11px] text-muted-foreground">{formatAcres(Number(f.acreage))}</p>
                </div>
                <StatusBadge status={f.status} />
              </Link>
            ))}
          </Panel>

          <Panel title="Upcoming Schedule" icon={<CalendarDays size={13} />} count={upcomingJobs.length} emptyText="No upcoming work.">
            {upcomingJobs.slice(0, 4).map(j => {
              const jf = (j as any).job_fields?.[0];
              return (
                <Link key={j.id} to={`/jobs/${j.id}`} className="flex items-center justify-between py-1.5 px-1 text-[13px] hover:bg-surface-2 rounded transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{jf?.fields?.name || j.title}</p>
                    <p className="text-[11px] text-muted-foreground">{formatOperationType(j.operation_type)} · {j.scheduled_start ? formatDateShort(j.scheduled_start) : "TBD"}</p>
                  </div>
                  <StatusBadge status={j.status} />
                </Link>
              );
            })}
          </Panel>
        </div>

        {/* Center — Active Jobs table */}
        <div className="lg:col-span-6">
          <div className="rounded-lg bg-card shadow-card h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-[13px] font-semibold">Active Jobs</h2>
              <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                <Link to="/marketplace"><Plus size={11} className="mr-1" /> New Job</Link>
              </Button>
            </div>
            {activeJobs.length > 0 ? (
              <div className="flex-1 overflow-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b text-left text-[11px] text-muted-foreground">
                      <th className="px-4 py-2 font-medium">Job</th>
                      <th className="px-4 py-2 font-medium hidden sm:table-cell">Type</th>
                      <th className="px-4 py-2 font-medium hidden md:table-cell">Acres</th>
                      <th className="px-4 py-2 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {activeJobs.slice(0, 10).map(job => {
                      const jf = (job as any).job_fields?.[0];
                      return (
                        <tr key={job.id} className="hover:bg-surface-2 transition-colors cursor-pointer" onClick={() => { window.location.assign(`/jobs/${job.id}`); }}>
                          <td className="px-4 py-2">
                            <p className="font-medium truncate max-w-[140px]">{jf?.fields?.name || job.title}</p>
                            <p className="text-[11px] text-muted-foreground">{job.display_id}</p>
                          </td>
                          <td className="px-4 py-2 hidden sm:table-cell text-muted-foreground">{formatOperationType(job.operation_type)}</td>
                          <td className="px-4 py-2 hidden md:table-cell tabular text-muted-foreground">{formatAcres(Number(job.total_acres))}</td>
                          <td className="px-4 py-2 text-right"><StatusBadge status={job.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <p className="text-[13px] text-muted-foreground">No active jobs. <Link to="/marketplace" className="text-primary hover:underline">Post a job</Link> to get started.</p>
              </div>
            )}
            {activeJobs.length > 10 && (
              <div className="px-4 py-2 border-t">
                <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" asChild>
                  <Link to="/jobs">View all {activeJobs.length} jobs <ArrowRight size={11} /></Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="lg:col-span-3 space-y-4">
          {/* Alerts */}
          <div className="rounded-lg bg-card shadow-card">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b">
              <Bell size={13} className="text-primary" />
              <h2 className="text-[13px] font-semibold">Alerts</h2>
              {recentAlerts.length > 0 && (
                <span className="ml-auto text-[9px] font-bold bg-destructive text-destructive-foreground rounded-full h-4 min-w-4 flex items-center justify-center px-1">{recentAlerts.length}</span>
              )}
            </div>
            <div className="divide-y max-h-52 overflow-auto">
              {recentAlerts.length > 0 ? recentAlerts.map(n => (
                <Link key={n.id} to={n.action_url || "/notifications"} className="block px-4 py-2 hover:bg-surface-2 transition-colors">
                  <p className="text-[11px] font-medium leading-snug line-clamp-2">{n.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatRelative(n.created_at)}</p>
                </Link>
              )) : (
                <p className="px-4 py-5 text-[11px] text-muted-foreground text-center">No new alerts.</p>
              )}
            </div>
            <div className="px-3 py-1.5 border-t">
              <Button variant="ghost" size="sm" className="w-full text-[11px] text-muted-foreground h-7" asChild>
                <Link to="/notifications">All notifications</Link>
              </Button>
            </div>
          </div>

          {/* Financial snapshot */}
          <div className="rounded-lg bg-card shadow-card p-4">
            <h2 className="text-[13px] font-semibold mb-2.5 flex items-center gap-1.5"><DollarSign size={13} /> Financial Snapshot</h2>
            <div className="space-y-1.5">
              <FinRow label="Quoted" value={formatCurrency(jobs.reduce((a, j) => a + Number(j.estimated_total || 0), 0))} />
              <FinRow label="Invoiced" value={formatCurrency(jobs.reduce((a, j) => a + Number(j.invoiced_total || 0), 0))} />
              <FinRow label="Paid" value={formatCurrency(totalSpend)} accent />
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-lg bg-card shadow-card p-4">
            <h2 className="text-[13px] font-semibold mb-2.5">Quick Actions</h2>
            <div className="space-y-1">
              <Button variant="outline" size="sm" className="w-full justify-start h-7 text-[11px]" asChild>
                <Link to="/fields"><Map size={12} className="mr-1.5" /> Add Field</Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start h-7 text-[11px]" asChild>
                <Link to="/marketplace"><Briefcase size={12} className="mr-1.5" /> Post a Job</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, icon, count, emptyText, children }: { title: string; icon: React.ReactNode; count: number; emptyText: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-card shadow-card">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b">
        {icon}
        <h2 className="text-[13px] font-semibold">{title}</h2>
        {count > 0 && <span className="ml-auto text-[10px] font-bold text-muted-foreground">{count}</span>}
      </div>
      <div className="px-3 py-2 max-h-48 overflow-auto">
        {count > 0 ? children : <p className="text-[11px] text-muted-foreground text-center py-4">{emptyText}</p>}
      </div>
    </div>
  );
}

function FinRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium tabular", accent && "text-primary")}>{value}</span>
    </div>
  );
}
