import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { DashboardSkeleton } from "@/components/shared/PageSkeleton";
import { Link } from "react-router-dom";
import {
  Briefcase, DollarSign, TrendingUp, ArrowRight, Package,
  Clock, FileText, Truck, Bell, MapPin, Star, Zap,
} from "lucide-react";
import { useJobs } from "@/hooks/useJobs";
import { useNotifications } from "@/hooks/useNotifications";
import { formatCurrency, formatAcres, formatOperationType, formatDateShort, formatRelative } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

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
        icon={<Truck size={24} />}
        title="No jobs yet"
        description="Check the marketplace for available jobs in your service area, or update your service profile to receive matching alerts."
        action={{ label: "Browse Marketplace", to: "/marketplace" }}
      />
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Today's Jobs" value={String(todayRoute.length)} change={`${jobsNeedingAction.length} need action`} changeType={jobsNeedingAction.length > 0 ? "negative" : "positive"} icon={<Briefcase size={18} />} />
        <StatCard label="Jobs to Quote" value={String(jobsToQuote.length)} change="Available now" changeType={jobsToQuote.length > 0 ? "positive" : "neutral"} icon={<FileText size={18} />} />
        <StatCard label="Packets Ready" value={String(activeJobs.length)} change={`${activeJobs.length} active jobs`} changeType="neutral" icon={<Package size={18} />} />
        <StatCard label="Earnings" value={formatCurrency(totalEarned)} change={`${completedJobs.length} jobs completed`} changeType="positive" icon={<DollarSign size={18} />} />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Left — Today's Route + Assigned Jobs */}
        <div className="lg:col-span-4 space-y-5">
          {/* Today's route */}
          <div className="rounded-xl bg-card shadow-card">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-sm font-semibold flex items-center gap-2"><Truck size={14} /> Today's Route</h2>
              <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                <Link to="/schedule">Full Schedule</Link>
              </Button>
            </div>
            {todayRoute.length > 0 ? (
              <div className="divide-y">
                {todayRoute.map((job, i) => {
                  const jf = (job as any).job_fields?.[0];
                  return (
                    <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{jf?.fields?.name || job.title}</p>
                        <p className="text-[11px] text-muted-foreground">{formatOperationType(job.operation_type)} · {formatAcres(Number(job.total_acres))}</p>
                      </div>
                      <StatusBadge status={job.status} />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center">
                <Clock size={20} className="mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No jobs scheduled for today.</p>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="rounded-xl bg-card shadow-card p-4">
            <h2 className="text-sm font-semibold mb-3">Quick Actions</h2>
            <div className="space-y-1.5">
              <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs" asChild>
                <Link to="/packets"><Package size={13} className="mr-2" /> Download Packets</Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs" asChild>
                <Link to="/marketplace"><Briefcase size={13} className="mr-2" /> Find Jobs</Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs" asChild>
                <Link to="/payouts"><DollarSign size={13} className="mr-2" /> View Payouts</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Center — Jobs to Quote table + Recommended */}
        <div className="lg:col-span-5 space-y-5">
          {/* Jobs to quote */}
          <div className="rounded-xl bg-card shadow-card">
            <div className="flex items-center justify-between px-5 py-3.5 border-b">
              <h2 className="text-sm font-semibold flex items-center gap-2"><FileText size={14} /> Available Jobs</h2>
              <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                <Link to="/marketplace">Browse All</Link>
              </Button>
            </div>
            {jobsToQuote.length > 0 ? (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="px-4 py-2 font-medium">Job</th>
                      <th className="px-4 py-2 font-medium hidden sm:table-cell">Acres</th>
                      <th className="px-4 py-2 font-medium text-right">Est. Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {jobsToQuote.slice(0, 5).map(job => {
                      const jf = (job as any).job_fields?.[0];
                      return (
                        <tr key={job.id} className="hover:bg-surface-2 transition-colors cursor-pointer" onClick={() => window.location.href = `/jobs/${job.id}`}>
                          <td className="px-4 py-2.5">
                            <p className="font-medium truncate max-w-[160px]">{job.title}</p>
                            <p className="text-[11px] text-muted-foreground">{formatOperationType(job.operation_type)} · by {formatDateShort(job.deadline)}</p>
                          </td>
                          <td className="px-4 py-2.5 hidden sm:table-cell tabular text-muted-foreground">{formatAcres(Number(job.total_acres))}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className="font-medium tabular">{formatCurrency(Number(job.estimated_total))}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">No open jobs in your service area.</div>
            )}
          </div>

          {/* Payout summary */}
          <div className="rounded-xl bg-card shadow-card p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><DollarSign size={14} /> Payout Summary</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completed Jobs</span>
                <span className="font-medium tabular">{completedJobs.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Earned</span>
                <span className="font-medium tabular text-primary">{formatCurrency(totalEarned)}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-3 text-xs text-muted-foreground" asChild>
              <Link to="/payouts">View all payouts <ArrowRight size={12} /></Link>
            </Button>
          </div>
        </div>

        {/* Right — Alerts */}
        <div className="lg:col-span-3 space-y-5">
          <div className="rounded-xl bg-card shadow-card">
            <div className="flex items-center gap-2 px-4 py-3 border-b">
              <Bell size={14} className="text-primary" />
              <h2 className="text-sm font-semibold">Alerts</h2>
              {matchAlerts.length > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full h-4 min-w-4 flex items-center justify-center px-1">{matchAlerts.length}</span>
              )}
            </div>
            <div className="divide-y max-h-72 overflow-auto">
              {matchAlerts.length > 0 ? matchAlerts.map(n => (
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

          {/* Assigned jobs count */}
          <div className="rounded-xl bg-card shadow-card p-4">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><Star size={14} /> My Stats</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active Jobs</span>
                <span className="font-medium tabular">{activeJobs.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">All Time Completed</span>
                <span className="font-medium tabular">{completedJobs.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Acres Worked</span>
                <span className="font-medium tabular">{formatAcres(completedJobs.reduce((a, j) => a + Number(j.total_acres || 0), 0))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
