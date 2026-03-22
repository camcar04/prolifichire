import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { DashboardSkeleton } from "@/components/shared/PageSkeleton";
import { ProfileScoreCard } from "@/components/shared/ProfileScoreCard";
import { NextStepBanner } from "@/components/dashboard/NextStepBanner";
import { ActionHero } from "@/components/dashboard/ActionHero";
import { ContextualGuidance, buildOperatorGuidance } from "@/components/dashboard/ContextualGuidance";
import { Link } from "react-router-dom";
import {
  Briefcase, DollarSign, ArrowRight, Package,
  Clock, FileText, Truck, Bell, Star, Search,
} from "lucide-react";
import { useJobs } from "@/hooks/useJobs";
import { useNotifications } from "@/hooks/useNotifications";
import { formatCurrency, formatAcres, formatOperationType, formatDateShort, formatRelative } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";

export default function OperatorDashboard() {
  const { user } = useAuth();
  const { data: allJobs = [], isLoading: jobsLoading } = useJobs();
  const { notifications } = useNotifications();

  if (jobsLoading) return <DashboardSkeleton />;

  const myJobs = allJobs.filter(j => j.operator_id === user?.id);
  const activeJobs = myJobs.filter(j => ["accepted", "scheduled", "in_progress"].includes(j.status));
  const jobsNeedingAction = myJobs.filter(j => j.status === "in_progress" && !j.proof_submitted);
  const jobsToQuote = allJobs.filter(j => j.status === "requested" && !j.operator_id);
  const todayRoute = activeJobs.filter(j => j.scheduled_start).sort((a, b) => new Date(a.scheduled_start!).getTime() - new Date(b.scheduled_start!).getTime());
  const completedJobs = myJobs.filter(j => ["completed", "approved", "paid", "closed"].includes(j.status));
  const totalEarned = myJobs.reduce((a, j) => a + Number(j.paid_total || 0), 0);
  const matchAlerts = notifications.filter(n => !n.read).slice(0, 5);

  if (myJobs.length === 0 && jobsToQuote.length === 0) {
    return (
      <EmptyState
        icon={<Truck size={20} />}
        title="No jobs yet"
        description="Browse the marketplace for available jobs, or update your service profile to receive alerts."
        action={{ label: "Browse Marketplace", to: "/marketplace" }}
      />
    );
  }

  const hasProofNeeded = jobsNeedingAction.length > 0;
  const hasWorkToday = todayRoute.length > 0;
  const guidanceItems = buildOperatorGuidance(myJobs, jobsToQuote);

  return (
    <div className="space-y-5 animate-fade-in">
      <NextStepBanner />

      {/* Primary Action — operator gets bold CTA */}
      {hasProofNeeded ? (
        <ActionHero
          icon={<FileText size={22} />}
          headline={`${jobsNeedingAction.length} Job${jobsNeedingAction.length > 1 ? "s" : ""} Need Proof of Work`}
          subline="Submit completion proof to get paid"
          cta="Submit Proof"
          to={`/jobs/${jobsNeedingAction[0].id}`}
          variant="operator"
          secondary={{ label: "View All", to: "/jobs" }}
        />
      ) : hasWorkToday ? (
        <ActionHero
          icon={<Truck size={22} />}
          headline={`${todayRoute.length} Job${todayRoute.length > 1 ? "s" : ""} Scheduled Today`}
          subline="Review packets and start your route"
          cta="Start Today's Work"
          to={`/jobs/${todayRoute[0].id}`}
          variant="operator"
          secondary={{ label: "View Schedule", to: "/schedule" }}
        />
      ) : (
        <ActionHero
          icon={<Search size={22} />}
          headline="Find Your Next Job"
          subline={`${jobsToQuote.length} job${jobsToQuote.length !== 1 ? "s" : ""} available in your area`}
          cta="Browse Jobs"
          to="/marketplace"
          variant="operator"
          secondary={{ label: "View Schedule", to: "/schedule" }}
        />
      )}

      {/* Guidance */}
      {guidanceItems.length > 0 && (
        <ContextualGuidance items={guidanceItems} title="What needs your attention" />
      )}

      {/* Stats — tight, data-dense */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Today's Jobs" value={String(todayRoute.length)} change={`${jobsNeedingAction.length} need action`} changeType={jobsNeedingAction.length > 0 ? "negative" : "positive"} icon={<Briefcase size={15} />} />
        <StatCard label="Jobs to Quote" value={String(jobsToQuote.length)} change="Available now" changeType={jobsToQuote.length > 0 ? "positive" : "neutral"} icon={<FileText size={15} />} />
        <StatCard label="Packets Ready" value={String(activeJobs.length)} change={`${activeJobs.length} active`} changeType="neutral" icon={<Package size={15} />} />
        <StatCard label="Earnings" value={formatCurrency(totalEarned)} change={`${completedJobs.length} completed`} changeType="positive" icon={<DollarSign size={15} />} />
      </div>

      {/* Main content — operator gets denser layout */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Left — Today's Route */}
        <div className="lg:col-span-3 space-y-4">
          <ProfileScoreCard />

          <div>
            <div className="flex items-center gap-1.5 mb-2 px-0.5">
              <Truck size={12} className="text-muted-foreground" />
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Today's Route</h3>
              <Button variant="ghost" size="sm" className="h-5 text-[10px] ml-auto px-1.5 text-muted-foreground" asChild>
                <Link to="/schedule">Schedule</Link>
              </Button>
            </div>
            <div className="rounded-xl bg-card shadow-card overflow-hidden">
              {todayRoute.length > 0 ? (
                <div className="divide-y">
                  {todayRoute.map((job, i) => {
                    const jf = (job as any).job_fields?.[0];
                    return (
                      <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface-2 transition-colors group">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium truncate group-hover:text-primary transition-colors">{jf?.fields?.name || job.title}</p>
                          <p className="text-[11px] text-muted-foreground">{formatOperationType(job.operation_type)} · {formatAcres(Number(job.total_acres))}</p>
                        </div>
                        <StatusBadge status={job.status} />
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <Clock size={16} className="mx-auto mb-1.5 text-muted-foreground/25" />
                  <p className="text-[12px] text-muted-foreground">No jobs scheduled today</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick actions — minimal */}
          <div className="space-y-1.5 px-0.5">
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Quick Actions</h3>
            <Button variant="outline" size="sm" className="w-full justify-start h-8 text-[12px] rounded-lg" asChild>
              <Link to="/packets"><Package size={13} className="mr-2 text-muted-foreground" /> Download Packets</Link>
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start h-8 text-[12px] rounded-lg" asChild>
              <Link to="/marketplace"><Briefcase size={13} className="mr-2 text-muted-foreground" /> Find Jobs</Link>
            </Button>
          </div>
        </div>

        {/* Center — Available Jobs */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-xl bg-card shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b">
              <h2 className="text-sm font-semibold tracking-tight">Available Jobs</h2>
              <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                <Link to="/marketplace">Browse All</Link>
              </Button>
            </div>
            {jobsToQuote.length > 0 ? (
              <div className="overflow-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b text-left text-[11px] text-muted-foreground uppercase tracking-wide">
                      <th className="px-5 py-2.5 font-medium">Job</th>
                      <th className="px-5 py-2.5 font-medium hidden sm:table-cell">Acres</th>
                      <th className="px-5 py-2.5 font-medium text-right">Est. Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {jobsToQuote.slice(0, 6).map(job => (
                      <tr key={job.id} className="hover:bg-surface-2 transition-colors cursor-pointer group" onClick={() => { window.location.assign(`/jobs/${job.id}`); }}>
                        <td className="px-5 py-3">
                          <p className="font-medium truncate max-w-[160px] group-hover:text-primary transition-colors">{job.title}</p>
                          <p className="text-[11px] text-muted-foreground">{formatOperationType(job.operation_type)} · by {formatDateShort(job.deadline)}</p>
                        </td>
                        <td className="px-5 py-3 hidden sm:table-cell tabular text-muted-foreground">{formatAcres(Number(job.total_acres))}</td>
                        <td className="px-5 py-3 text-right">
                          <span className="font-semibold tabular">{formatCurrency(Number(job.estimated_total))}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Briefcase size={24} className="mx-auto mb-2 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">No open jobs in your service area</p>
              </div>
            )}
          </div>

          {/* Earnings — inline, clean */}
          <div className="rounded-xl bg-card shadow-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Earnings Summary</h2>
              <Button variant="ghost" size="sm" className="h-6 text-[11px] text-muted-foreground" asChild>
                <Link to="/payouts">Details <ArrowRight size={10} /></Link>
              </Button>
            </div>
            <div className="flex items-baseline gap-6">
              <div>
                <p className="text-2xl font-bold tabular tracking-tight text-primary">{formatCurrency(totalEarned)}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Total earned</p>
              </div>
              <div className="border-l pl-6">
                <p className="text-lg font-bold tabular tracking-tight">{completedJobs.length}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Jobs completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Alerts + Stats */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-xl bg-card shadow-card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b">
              <Bell size={13} className="text-primary" />
              <h2 className="text-[13px] font-semibold">Alerts</h2>
              {matchAlerts.length > 0 && (
                <span className="ml-auto text-[9px] font-bold bg-destructive text-destructive-foreground rounded-full h-4 min-w-4 flex items-center justify-center px-1">{matchAlerts.length}</span>
              )}
            </div>
            <div className="divide-y max-h-48 overflow-auto">
              {matchAlerts.length > 0 ? matchAlerts.map(n => (
                <Link key={n.id} to={n.action_url || "/notifications"} className="block px-4 py-2.5 hover:bg-surface-2 transition-colors">
                  <p className="text-[12px] font-medium leading-snug line-clamp-2">{n.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatRelative(n.created_at)}</p>
                </Link>
              )) : (
                <p className="px-4 py-6 text-[12px] text-muted-foreground text-center">No new alerts</p>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-card shadow-card p-4">
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Performance</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-muted-foreground">Active Jobs</span>
                <span className="font-semibold tabular">{activeJobs.length}</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-semibold tabular">{completedJobs.length}</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-muted-foreground">Total Acres</span>
                <span className="font-semibold tabular">{formatAcres(completedJobs.reduce((a, j) => a + Number(j.total_acres || 0), 0))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
