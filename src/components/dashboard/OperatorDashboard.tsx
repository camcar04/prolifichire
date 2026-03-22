import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { DashboardSkeleton } from "@/components/shared/PageSkeleton";
import { Link } from "react-router-dom";
import {
  Briefcase, DollarSign, TrendingUp, ArrowRight, Package,
  MapPin, Clock, CheckCircle2, AlertTriangle, FileText, Truck, Bell,
} from "lucide-react";
import { useJobs } from "@/hooks/useJobs";
import { useNotifications } from "@/hooks/useNotifications";
import { formatCurrency, formatAcres, formatOperationType, formatDateShort } from "@/lib/format";
import { formatDistanceToNow } from "date-fns";
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
  const todayRoute = activeJobs.filter(j => j.scheduled_start);
  const matchAlerts = notifications.filter(n => n.type === "job_match" && !n.read).slice(0, 3);
  const recentActivity = notifications.slice(0, 5);

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
    <div className="space-y-6 animate-fade-in">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Jobs" value={String(activeJobs.length)} change={`${jobsNeedingAction.length} need action`} changeType={jobsNeedingAction.length > 0 ? "negative" : "positive"} icon={<Briefcase size={20} />} />
        <StatCard label="Jobs to Quote" value={String(jobsToQuote.length)} change="Available now" changeType="neutral" icon={<FileText size={20} />} />
        <StatCard label="Completed" value={String(myJobs.filter(j => ["completed", "approved", "paid", "closed"].includes(j.status)).length)} change="All time" changeType="positive" icon={<TrendingUp size={20} />} />
        <StatCard label="Total Earned" value={formatCurrency(myJobs.reduce((a, j) => a + Number(j.paid_total || 0), 0))} change="Year to date" changeType="positive" icon={<DollarSign size={20} />} />
      </div>

      {jobsNeedingAction.length > 0 && (
        <div className="rounded-xl bg-warning/8 border border-warning/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-warning" />
            <h3 className="text-sm font-semibold">{jobsNeedingAction.length} Job{jobsNeedingAction.length > 1 ? "s" : ""} Need Proof of Work</h3>
          </div>
          <div className="space-y-1.5">
            {jobsNeedingAction.map(j => {
              const jf = (j as any).job_fields?.[0];
              return (
                <Link key={j.id} to={`/jobs/${j.id}`} className="flex items-center justify-between text-sm hover:underline">
                  <span>{j.display_id} — {jf?.fields?.name || j.title}</span>
                  <ArrowRight size={14} />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl bg-card shadow-card">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold flex items-center gap-2"><Truck size={16} /> Today's Route</h2>
              <Button variant="outline" size="sm" asChild>
                <Link to="/schedule">Full Schedule</Link>
              </Button>
            </div>
            {todayRoute.length > 0 ? (
              <div className="divide-y">
                {todayRoute.map((job, i) => {
                  const jf = (job as any).job_fields?.[0];
                  return (
                    <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center gap-4 p-4 hover:bg-surface-2 transition-colors">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{jf?.fields?.name || job.title}</p>
                        <p className="text-xs text-muted-foreground">{formatOperationType(job.operation_type)} · {formatAcres(Number(job.total_acres))}</p>
                      </div>
                      <StatusBadge status={job.status} />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <Clock size={24} className="mx-auto mb-2 text-muted-foreground/30" />
                No jobs scheduled for today.
              </div>
            )}
          </div>

          <div className="rounded-xl bg-card shadow-card">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold flex items-center gap-2"><FileText size={16} /> Jobs to Quote</h2>
              <Button variant="outline" size="sm" asChild>
                <Link to="/marketplace">Browse All</Link>
              </Button>
            </div>
            {jobsToQuote.length > 0 ? (
              <div className="divide-y">
                {jobsToQuote.slice(0, 4).map(job => {
                  const jf = (job as any).job_fields?.[0];
                  return (
                    <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center justify-between p-4 hover:bg-surface-2 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{job.title}</p>
                        <p className="text-xs text-muted-foreground">{jf?.fields?.name} · {formatAcres(Number(job.total_acres))} · by {formatDateShort(job.deadline)}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-medium tabular">{formatCurrency(Number(job.estimated_total))}</span>
                        <Button size="sm" variant="outline">Quote</Button>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">No open jobs in your service area.</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {matchAlerts.length > 0 && (
            <div className="rounded-xl bg-card shadow-card p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><Bell size={15} className="text-primary" /> New Matches</h2>
              <div className="space-y-2.5">
                {matchAlerts.map(n => (
                  <Link key={n.id} to={n.action_url || "/marketplace"} className="block rounded-lg bg-primary/5 border border-primary/15 p-2.5 hover:bg-primary/10 transition-colors">
                    <p className="text-sm font-medium leading-snug">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl bg-card shadow-card p-5">
            <h2 className="font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link to="/packets"><Package size={14} /> Download Packets</Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link to="/marketplace"><Briefcase size={14} /> Find Jobs</Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link to="/payouts"><DollarSign size={14} /> View Payouts</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-xl bg-card shadow-card p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><Bell size={15} /> Recent Activity</h2>
            {recentActivity.length > 0 ? (
              <div className="space-y-2">
                {recentActivity.map(n => (
                  <div key={n.id} className="text-sm">
                    <p className="font-medium leading-snug">{n.title}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
