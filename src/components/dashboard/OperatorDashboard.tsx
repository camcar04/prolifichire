import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { DashboardSkeleton } from "@/components/shared/PageSkeleton";
import { ProfileScoreCard } from "@/components/shared/ProfileScoreCard";
import { NextStepBanner } from "@/components/dashboard/NextStepBanner";
import { CommandStrip } from "@/components/dashboard/CommandStrip";
import { KPIStrip } from "@/components/dashboard/KPIStrip";
import { ContextualGuidance, buildOperatorGuidance } from "@/components/dashboard/ContextualGuidance";
import { PricingInsightsPanel } from "@/components/operators/PricingInsightsPanel";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase, DollarSign, ArrowRight, Package,
  FileText, Truck, Bell, Search,
} from "lucide-react";
import { useJobs } from "@/hooks/useJobs";
import { useNotifications } from "@/hooks/useNotifications";
import { formatCurrency, formatAcres, formatOperationType, formatDateShort, formatRelative } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";

export default function OperatorDashboard() {
  const { user } = useAuth();
  const { data: allJobs = [], isLoading: jobsLoading } = useJobs();
  const { notifications } = useNotifications();
  const navigate = useNavigate();

  if (jobsLoading) return <DashboardSkeleton />;

  const myJobs = allJobs.filter(j => j.operator_id === user?.id);
  const activeJobs = myJobs.filter(j => ["accepted", "scheduled", "in_progress"].includes(j.status));
  const jobsNeedingAction = myJobs.filter(j => j.status === "in_progress" && !j.proof_submitted);
  const jobsToQuote = allJobs.filter(j => j.status === "requested" && !j.operator_id);
  const todayRoute = activeJobs.filter(j => j.scheduled_start).sort((a, b) => new Date(a.scheduled_start!).getTime() - new Date(b.scheduled_start!).getTime());
  const completedJobs = myJobs.filter(j => ["completed", "approved", "paid", "closed"].includes(j.status));
  const totalEarned = myJobs.reduce((a, j) => a + Number(j.paid_total || 0), 0);
  const matchAlerts = notifications.filter(n => !n.read).slice(0, 5);
  const guidanceItems = buildOperatorGuidance(myJobs, jobsToQuote);

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

  return (
    <div className="space-y-3 animate-fade-in">
      <NextStepBanner />

      {/* Command strip — operational, not promotional */}
      {jobsNeedingAction.length > 0 ? (
        <CommandStrip
          icon={<FileText size={16} />}
          label={`${jobsNeedingAction.length} job${jobsNeedingAction.length > 1 ? "s" : ""} need proof of work`}
          detail="Submit completion proof to get paid"
          cta="Submit Proof"
          to={`/jobs/${jobsNeedingAction[0].id}`}
          urgency="action"
          secondary={{ label: "All Jobs", to: "/jobs" }}
        />
      ) : todayRoute.length > 0 ? (
        <CommandStrip
          icon={<Truck size={16} />}
          label={`${todayRoute.length} job${todayRoute.length > 1 ? "s" : ""} scheduled today`}
          detail="Review packets and start your route"
          cta="Start Work"
          to={`/jobs/${todayRoute[0].id}`}
          urgency="info"
          secondary={{ label: "Schedule", to: "/schedule" }}
        />
      ) : (
        <CommandStrip
          icon={<Search size={16} />}
          label={`${jobsToQuote.length} job${jobsToQuote.length !== 1 ? "s" : ""} available in your area`}
          cta="Browse Jobs"
          to="/marketplace"
          urgency="neutral"
        />
      )}

      {/* KPI strip — dense inline metrics */}
      <KPIStrip items={[
        { label: "Today", value: String(todayRoute.length), sub: `${jobsNeedingAction.length} need action` },
        { label: "To Quote", value: String(jobsToQuote.length), sub: "Available now" },
        { label: "Active", value: String(activeJobs.length) },
        { label: "Earned", value: formatCurrency(totalEarned), accent: true, sub: `${completedJobs.length} completed` },
      ]} className="rounded border bg-card px-3 py-1" />

      {/* Guidance rail */}
      {guidanceItems.length > 0 && (
        <ContextualGuidance items={guidanceItems} title="What needs your attention" />
      )}

      {/* Main work surface — 2-column dispatch layout */}
      <div className="grid lg:grid-cols-5 gap-3">
        {/* Left: Today's route + quick actions */}
        <div className="lg:col-span-2 space-y-3">
           <div className="rounded border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-surface-2/40">
              <div className="flex items-center gap-1.5">
                <Truck size={11} className="text-muted-foreground" />
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Today's Route</h3>
              </div>
              <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5 text-muted-foreground" asChild>
                <Link to="/schedule">Schedule</Link>
              </Button>
            </div>
            {todayRoute.length > 0 ? (
              <div className="divide-y">
                {todayRoute.map((job, i) => {
                  const jf = (job as any).job_fields?.[0];
                  return (
                    <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center gap-2.5 px-3 py-2 hover:bg-surface-2 transition-colors group">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[9px] font-bold shrink-0">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium truncate group-hover:text-primary transition-colors">{jf?.fields?.name || job.title}</p>
                        <p className="text-[10px] text-muted-foreground">{formatOperationType(job.operation_type)} · {formatAcres(Number(job.total_acres))}</p>
                      </div>
                      <StatusBadge status={job.status} />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-[11px] text-muted-foreground">No jobs scheduled today</p>
              </div>
            )}
          </div>

          <ProfileScoreCard />
          <PricingInsightsPanel />

          <div className="space-y-1">
            <Button variant="outline" size="sm" className="w-full justify-start h-7 text-[11px]" asChild>
              <Link to="/packets"><Package size={12} className="mr-2 text-muted-foreground" /> Download Packets</Link>
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start h-7 text-[11px]" asChild>
              <Link to="/marketplace"><Briefcase size={12} className="mr-2 text-muted-foreground" /> Find Jobs</Link>
            </Button>
          </div>
        </div>

        {/* Right: Available jobs table + earnings + alerts */}
        <div className="lg:col-span-3 space-y-4">
          {/* Available jobs — dense table, dominant */}
           <div className="rounded border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-surface-2/40">
              <h2 className="text-[13px] font-semibold tracking-tight">Available Jobs</h2>
              <Button variant="outline" size="sm" className="h-6 text-[11px] px-2" asChild>
                <Link to="/marketplace">Browse All</Link>
              </Button>
            </div>
            {jobsToQuote.length > 0 ? (
              <div className="overflow-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-left text-[10px] text-muted-foreground uppercase tracking-wider border-b">
                      <th className="px-4 py-2 font-medium">Job</th>
                      <th className="px-4 py-2 font-medium hidden sm:table-cell">Acres</th>
                      <th className="px-4 py-2 font-medium text-right">Est. Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {jobsToQuote.slice(0, 6).map(job => (
                      <tr key={job.id} className="hover:bg-surface-2 transition-colors cursor-pointer group" onClick={() => navigate(`/jobs/${job.id}`)}>
                        <td className="px-4 py-2.5">
                          <p className="font-medium truncate max-w-[160px] group-hover:text-primary transition-colors">{job.title}</p>
                          <p className="text-[10px] text-muted-foreground">{formatOperationType(job.operation_type)} · by {formatDateShort(job.deadline)}</p>
                        </td>
                        <td className="px-4 py-2.5 hidden sm:table-cell tabular text-muted-foreground">{formatAcres(Number(job.total_acres))}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className="font-semibold tabular">{formatCurrency(Number(job.estimated_total))}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center">
                <Briefcase size={18} className="mx-auto mb-1.5 text-muted-foreground/20" />
                <p className="text-[12px] text-muted-foreground">No open jobs in your service area</p>
              </div>
            )}
          </div>

          {/* Earnings — horizontal inline, not a card cluster */}
          <div className="flex items-stretch gap-3 rounded border bg-card p-3">
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Total Earned</p>
              <p className="text-xl font-bold tabular tracking-tight text-primary mt-0.5">{formatCurrency(totalEarned)}</p>
            </div>
            <div className="border-l" />
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Completed</p>
              <p className="text-xl font-bold tabular tracking-tight mt-0.5">{completedJobs.length}</p>
            </div>
            <div className="border-l" />
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Total Acres</p>
              <p className="text-xl font-bold tabular tracking-tight mt-0.5">{formatAcres(completedJobs.reduce((a, j) => a + Number(j.total_acres || 0), 0))}</p>
            </div>
            <Button variant="ghost" size="sm" className="self-center h-6 text-[10px] text-muted-foreground shrink-0" asChild>
              <Link to="/payouts">Details <ArrowRight size={8} /></Link>
            </Button>
          </div>

          {/* Alerts — compact */}
           <div className="rounded border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b bg-surface-2/40">
              <Bell size={11} className="text-muted-foreground" />
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Alerts</h3>
              {matchAlerts.length > 0 && (
                <span className="ml-auto text-[9px] font-bold bg-destructive text-destructive-foreground rounded-full h-4 min-w-4 flex items-center justify-center px-1">{matchAlerts.length}</span>
              )}
            </div>
            <div className="divide-y max-h-32 overflow-auto">
              {matchAlerts.length > 0 ? matchAlerts.map(n => (
                <Link key={n.id} to={n.action_url || "/notifications"} className="block px-3 py-2 hover:bg-surface-2 transition-colors">
                  <p className="text-[11px] font-medium leading-snug line-clamp-2">{n.title}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{formatRelative(n.created_at)}</p>
                </Link>
              )) : (
                <p className="px-3 py-4 text-[11px] text-muted-foreground text-center">No new alerts</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
