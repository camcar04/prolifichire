import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/shared/PageSkeleton";
import { FirstJobOnboarding } from "@/components/onboarding/FirstJobOnboarding";
import { ProfileScoreCard } from "@/components/shared/ProfileScoreCard";
import { NextStepBanner } from "@/components/dashboard/NextStepBanner";
import { ActionHero } from "@/components/dashboard/ActionHero";
import { ContextualGuidance, buildGrowerGuidance } from "@/components/dashboard/ContextualGuidance";
import { Link } from "react-router-dom";
import {
  Map, Briefcase, DollarSign, TrendingUp, Plus, ArrowRight,
  AlertTriangle, CheckCircle2, Bell, CalendarDays, Sprout,
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

  if (fields.length === 0 && jobs.length === 0) {
    return <FirstJobOnboarding />;
  }

  const hasPendingApprovals = pendingApprovals.length > 0;
  const hasFieldsNeedingWork = fieldsNeedingAction.length > 0;
  const guidanceItems = buildGrowerGuidance(jobs, fields);

  return (
    <div className="space-y-5 animate-fade-in">
      <NextStepBanner />

      {/* Primary Action — full width, dominant */}
      {hasPendingApprovals ? (
        <ActionHero
          icon={<CheckCircle2 size={22} />}
          headline={`${pendingApprovals.length} Job${pendingApprovals.length > 1 ? "s" : ""} Awaiting Your Approval`}
          subline="Review completed work and release payment"
          cta="Review Now"
          to={`/jobs/${pendingApprovals[0].id}`}
          variant="grower"
          secondary={{ label: "View All Jobs", to: "/jobs" }}
        />
      ) : hasFieldsNeedingWork ? (
        <ActionHero
          icon={<AlertTriangle size={22} />}
          headline={`${fieldsNeedingAction.length} Field${fieldsNeedingAction.length > 1 ? "s" : ""} Need Attention`}
          subline="Update field data to keep operations running"
          cta="View Fields"
          to="/fields"
          variant="grower"
          secondary={{ label: "Post a Job", to: "/marketplace" }}
        />
      ) : (
        <ActionHero
          icon={<Sprout size={22} />}
          headline="Ready to Hire?"
          subline="Post a job to get quotes from verified operators in your area"
          cta="Post a Job"
          to="/marketplace"
          variant="grower"
          secondary={{ label: "Add Field", to: "/fields" }}
        />
      )}

      {/* Guidance — no card wrapper, inline feel */}
      {guidanceItems.length > 0 && (
        <ContextualGuidance items={guidanceItems} />
      )}

      {/* Stats — tighter row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Active Jobs" value={String(activeJobs.length)} change={`${inProgress.length} in progress`} changeType="neutral" icon={<Briefcase size={15} />} />
        <StatCard label="Awaiting Approval" value={String(pendingApprovals.length)} changeType={pendingApprovals.length > 0 ? "negative" : "positive"} change={pendingApprovals.length > 0 ? "Action needed" : "All clear"} icon={<CheckCircle2 size={15} />} />
        <StatCard label="In Progress" value={String(inProgress.length)} change={`${formatAcres(inProgress.reduce((a, j) => a + Number(j.total_acres || 0), 0))} total`} changeType="neutral" icon={<TrendingUp size={15} />} />
        <StatCard label="Total Spend" value={formatCurrency(totalSpend)} change="Year to date" changeType="neutral" icon={<DollarSign size={15} />} />
      </div>

      {/* Main grid — asymmetric layout */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Left sidebar — compact, no excess padding */}
        <div className="lg:col-span-3 space-y-4">
          <ProfileScoreCard />

          {/* Fields needing action — list style, not heavy card */}
          <SidePanel title="Fields" icon={<AlertTriangle size={12} />} count={fieldsNeedingAction.length} emptyText="All fields up to date.">
            {fieldsNeedingAction.map(f => (
              <Link key={f.id} to={`/fields/${f.id}`} className="flex items-center justify-between py-2 px-1 text-[13px] hover:bg-surface-2 rounded transition-colors group">
                <div className="min-w-0">
                  <p className="font-medium truncate group-hover:text-primary transition-colors">{f.name}</p>
                  <p className="text-[11px] text-muted-foreground">{formatAcres(Number(f.acreage))}</p>
                </div>
                <StatusBadge status={f.status} />
              </Link>
            ))}
          </SidePanel>

          {/* Upcoming — minimal list */}
          <SidePanel title="Upcoming" icon={<CalendarDays size={12} />} count={upcomingJobs.length} emptyText="No upcoming work.">
            {upcomingJobs.slice(0, 4).map(j => {
              const jf = (j as any).job_fields?.[0];
              return (
                <Link key={j.id} to={`/jobs/${j.id}`} className="flex items-center justify-between py-2 px-1 text-[13px] hover:bg-surface-2 rounded transition-colors group">
                  <div className="min-w-0">
                    <p className="font-medium truncate group-hover:text-primary transition-colors">{jf?.fields?.name || j.title}</p>
                    <p className="text-[11px] text-muted-foreground">{formatOperationType(j.operation_type)} · {j.scheduled_start ? formatDateShort(j.scheduled_start) : "TBD"}</p>
                  </div>
                  <StatusBadge status={j.status} />
                </Link>
              );
            })}
          </SidePanel>
        </div>

        {/* Center — Active Jobs, dominant area */}
        <div className="lg:col-span-6">
          <div className="rounded-xl bg-card shadow-card h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b">
              <h2 className="text-sm font-semibold tracking-tight">Active Jobs</h2>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
                <Link to="/marketplace"><Plus size={11} /> New Job</Link>
              </Button>
            </div>
            {activeJobs.length > 0 ? (
              <div className="flex-1 overflow-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b text-left text-[11px] text-muted-foreground uppercase tracking-wide">
                      <th className="px-5 py-2.5 font-medium">Job</th>
                      <th className="px-5 py-2.5 font-medium hidden sm:table-cell">Type</th>
                      <th className="px-5 py-2.5 font-medium hidden md:table-cell">Acres</th>
                      <th className="px-5 py-2.5 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {activeJobs.slice(0, 10).map(job => {
                      const jf = (job as any).job_fields?.[0];
                      return (
                        <tr key={job.id} className="hover:bg-surface-2 transition-colors cursor-pointer group" onClick={() => { window.location.assign(`/jobs/${job.id}`); }}>
                          <td className="px-5 py-3">
                            <p className="font-medium truncate max-w-[160px] group-hover:text-primary transition-colors">{jf?.fields?.name || job.title}</p>
                            <p className="text-[11px] text-muted-foreground font-mono">{job.display_id}</p>
                          </td>
                          <td className="px-5 py-3 hidden sm:table-cell text-muted-foreground">{formatOperationType(job.operation_type)}</td>
                          <td className="px-5 py-3 hidden md:table-cell tabular text-muted-foreground">{formatAcres(Number(job.total_acres))}</td>
                          <td className="px-5 py-3 text-right"><StatusBadge status={job.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <Briefcase size={24} className="mx-auto mb-2 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">No active jobs</p>
                  <Button variant="link" size="sm" className="mt-1 text-xs" asChild>
                    <Link to="/marketplace">Post a job to get started</Link>
                  </Button>
                </div>
              </div>
            )}
            {activeJobs.length > 10 && (
              <div className="px-5 py-2.5 border-t">
                <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground gap-1" asChild>
                  <Link to="/jobs">View all {activeJobs.length} jobs <ArrowRight size={11} /></Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right — stacked, less visual weight */}
        <div className="lg:col-span-3 space-y-4">
          {/* Alerts — compact */}
          <div className="rounded-xl bg-card shadow-card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b">
              <Bell size={13} className="text-primary" />
              <h2 className="text-[13px] font-semibold">Alerts</h2>
              {recentAlerts.length > 0 && (
                <span className="ml-auto text-[9px] font-bold bg-destructive text-destructive-foreground rounded-full h-4 min-w-4 flex items-center justify-center px-1">{recentAlerts.length}</span>
              )}
            </div>
            <div className="divide-y max-h-48 overflow-auto">
              {recentAlerts.length > 0 ? recentAlerts.map(n => (
                <Link key={n.id} to={n.action_url || "/notifications"} className="block px-4 py-2.5 hover:bg-surface-2 transition-colors">
                  <p className="text-[12px] font-medium leading-snug line-clamp-2">{n.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatRelative(n.created_at)}</p>
                </Link>
              )) : (
                <p className="px-4 py-6 text-[12px] text-muted-foreground text-center">No new alerts</p>
              )}
            </div>
            {recentAlerts.length > 0 && (
              <div className="px-3 py-1.5 border-t">
                <Button variant="ghost" size="sm" className="w-full text-[11px] text-muted-foreground h-7" asChild>
                  <Link to="/notifications">All notifications</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Financials — no card header, just content */}
          <div className="rounded-xl bg-card shadow-card p-4">
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Financials</h2>
            <div className="space-y-2.5">
              <FinRow label="Quoted" value={formatCurrency(jobs.reduce((a, j) => a + Number(j.estimated_total || 0), 0))} />
              <FinRow label="Invoiced" value={formatCurrency(jobs.reduce((a, j) => a + Number(j.invoiced_total || 0), 0))} />
              <div className="border-t pt-2.5">
                <FinRow label="Paid" value={formatCurrency(totalSpend)} accent />
              </div>
            </div>
          </div>

          {/* Quick actions — minimal, no card feel */}
          <div className="space-y-1.5 px-0.5">
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Quick Actions</h3>
            <Button variant="outline" size="sm" className="w-full justify-start h-8 text-[12px] rounded-lg" asChild>
              <Link to="/fields"><Map size={13} className="mr-2 text-muted-foreground" /> Add Field</Link>
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start h-8 text-[12px] rounded-lg" asChild>
              <Link to="/marketplace"><Briefcase size={13} className="mr-2 text-muted-foreground" /> Post a Job</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Side panel — lighter weight than a full card */
function SidePanel({ title, icon, count, emptyText, children }: { title: string; icon: React.ReactNode; count: number; emptyText: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 px-0.5">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
        {count > 0 && <span className="text-[10px] font-bold text-foreground bg-surface-3 rounded-full h-4 min-w-4 flex items-center justify-center px-1 ml-auto">{count}</span>}
      </div>
      <div className="rounded-xl bg-card shadow-card px-3 py-1">
        {count > 0 ? children : <p className="text-[12px] text-muted-foreground text-center py-5">{emptyText}</p>}
      </div>
    </div>
  );
}

function FinRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold tabular", accent ? "text-primary" : "text-foreground")}>{value}</span>
    </div>
  );
}
