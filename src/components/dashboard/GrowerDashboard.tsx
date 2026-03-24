import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/shared/PageSkeleton";
import { FirstJobOnboarding } from "@/components/onboarding/FirstJobOnboarding";
import { ProfileScoreCard } from "@/components/shared/ProfileScoreCard";
import { NextStepBanner } from "@/components/dashboard/NextStepBanner";
import { CommandStrip } from "@/components/dashboard/CommandStrip";
import { KPIStrip } from "@/components/dashboard/KPIStrip";
import { ContextualGuidance, buildGrowerGuidance } from "@/components/dashboard/ContextualGuidance";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase, DollarSign, Plus, ArrowRight,
  CheckCircle2, AlertTriangle, Bell, Sprout,
} from "lucide-react";
import { CreateJobDialog } from "@/components/jobs/CreateJobDialog";
import { useFields } from "@/hooks/useFields";
import { useJobs } from "@/hooks/useJobs";
import { useNotifications } from "@/hooks/useNotifications";
import { formatCurrency, formatAcres, formatOperationType, formatDateShort, formatRelative } from "@/lib/format";

export default function GrowerDashboard() {
  const { data: fields = [], isLoading: fieldsLoading } = useFields();
  const { data: jobs = [], isLoading: jobsLoading } = useJobs();
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  const [showCreateJob, setShowCreateJob] = useState(false);

  const isLoading = fieldsLoading || jobsLoading;
  if (isLoading) return <DashboardSkeleton />;

  const activeJobs = jobs.filter(j => ["requested", "quoted", "accepted", "scheduled", "in_progress"].includes(j.status));
  const pendingApprovals = jobs.filter(j => j.proof_submitted && !j.proof_approved);
  const inProgress = jobs.filter(j => j.status === "in_progress");
  const fieldsNeedingAction = fields.filter(f => f.status === "pending" || f.status === "restricted");
  const recentAlerts = notifications.filter(n => !n.read).slice(0, 5);
  const totalSpend = jobs.reduce((a, j) => a + Number(j.paid_total || 0), 0);
  const guidanceItems = buildGrowerGuidance(jobs, fields);

  if (fields.length === 0 && jobs.length === 0) {
    return <FirstJobOnboarding />;
  }

  return (
    <div className="space-y-3 animate-fade-in">
      <NextStepBanner />

      {/* Command strip — not a hero, an operational signal */}
      {pendingApprovals.length > 0 ? (
        <CommandStrip
          icon={<CheckCircle2 size={16} />}
          label={`${pendingApprovals.length} job${pendingApprovals.length > 1 ? "s" : ""} awaiting approval`}
          detail="Review completed work and release payment"
          cta="Review"
          to={`/jobs/${pendingApprovals[0].id}`}
          urgency="action"
          secondary={{ label: "All Jobs", to: "/jobs" }}
        />
      ) : fieldsNeedingAction.length > 0 ? (
        <CommandStrip
          icon={<AlertTriangle size={16} />}
          label={`${fieldsNeedingAction.length} field${fieldsNeedingAction.length > 1 ? "s" : ""} need attention`}
          detail="Update field data to keep operations running"
          cta="View Fields"
          to="/fields"
          urgency="action"
        />
      ) : (
        <CommandStrip
          icon={<Sprout size={16} />}
          label="Post a job to get quotes from verified operators"
          cta="Post Job"
          to="/marketplace"
          urgency="neutral"
        />
      )}

      {/* Inline KPI strip — replaces stat card grid */}
      <KPIStrip items={[
        { label: "Active", value: String(activeJobs.length), sub: `${inProgress.length} running` },
        { label: "Approvals", value: String(pendingApprovals.length), sub: pendingApprovals.length > 0 ? "Action needed" : "Clear" },
        { label: "Fields", value: String(fields.length), sub: `${formatAcres(fields.reduce((a, f) => a + Number(f.acreage || 0), 0))}` },
        { label: "Spent YTD", value: formatCurrency(totalSpend), accent: true },
      ]} className="rounded border bg-card px-3 py-1" />

      {/* Guidance rail */}
      {guidanceItems.length > 0 && (
        <ContextualGuidance items={guidanceItems} />
      )}

      {/* Main work surface — dominant job table */}
      <div className="grid lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
           <div className="rounded border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-surface-2/40">
              <h2 className="text-[13px] font-semibold tracking-tight">Active Jobs</h2>
              <Button variant="outline" size="sm" className="h-6 text-[11px] gap-1 px-2" asChild>
                <Link to="/marketplace"><Plus size={10} /> New</Link>
              </Button>
            </div>
            {activeJobs.length > 0 ? (
              <div className="overflow-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left text-[10px] text-muted-foreground uppercase tracking-wider border-b">
                      <th className="px-4 py-2 font-medium">Job</th>
                      <th className="px-4 py-2 font-medium hidden sm:table-cell">Type</th>
                      <th className="px-4 py-2 font-medium hidden md:table-cell">Acres</th>
                      <th className="px-4 py-2 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {activeJobs.slice(0, 12).map(job => {
                      const jf = (job as any).job_fields?.[0];
                      return (
                        <tr
                          key={job.id}
                          className="hover:bg-surface-2 transition-colors cursor-pointer group"
                          onClick={() => navigate(`/jobs/${job.id}`)}
                        >
                          <td className="px-4 py-2.5">
                            <p className="font-medium truncate max-w-[180px] group-hover:text-primary transition-colors">{jf?.fields?.name || job.title}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{job.display_id}</p>
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
              <div className="py-10 text-center">
                <Briefcase size={20} className="mx-auto mb-1.5 text-muted-foreground/20" />
                <p className="text-[13px] text-muted-foreground">No active jobs</p>
                <Button variant="link" size="sm" className="text-[11px] mt-0.5" asChild>
                  <Link to="/marketplace">Post your first job →</Link>
                </Button>
              </div>
            )}
            {activeJobs.length > 12 && (
              <div className="px-4 py-2 border-t">
                <Button variant="ghost" size="sm" className="w-full text-[11px] text-muted-foreground h-6 gap-1" asChild>
                  <Link to="/jobs">View all {activeJobs.length} <ArrowRight size={10} /></Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right column — stacked lightweight panels */}
        <div className="space-y-4">
          <ProfileScoreCard />

          {/* Alerts — minimal list */}
           <div className="rounded border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b bg-surface-2/40">
              <Bell size={12} className="text-muted-foreground" />
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Alerts</h3>
              {recentAlerts.length > 0 && (
                <span className="ml-auto text-[9px] font-bold bg-destructive text-destructive-foreground rounded-full h-4 min-w-4 flex items-center justify-center px-1">{recentAlerts.length}</span>
              )}
            </div>
            <div className="divide-y max-h-40 overflow-auto">
              {recentAlerts.length > 0 ? recentAlerts.map(n => (
                <Link key={n.id} to={n.action_url || "/notifications"} className="block px-3 py-2 hover:bg-surface-2 transition-colors">
                  <p className="text-[11px] font-medium leading-snug line-clamp-2">{n.title}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{formatRelative(n.created_at)}</p>
                </Link>
              )) : (
                <p className="px-3 py-5 text-[11px] text-muted-foreground text-center">No new alerts</p>
              )}
            </div>
          </div>

          {/* Financials — inline summary */}
          <div className="rounded border bg-card p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Financials</h3>
              <Button variant="ghost" size="sm" className="h-5 text-[10px] text-muted-foreground px-1.5" asChild>
                <Link to="/finance">Details <ArrowRight size={8} /></Link>
              </Button>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[12px]"><span className="text-muted-foreground">Quoted</span><span className="tabular font-medium">{formatCurrency(jobs.reduce((a, j) => a + Number(j.estimated_total || 0), 0))}</span></div>
              <div className="flex justify-between text-[12px]"><span className="text-muted-foreground">Invoiced</span><span className="tabular font-medium">{formatCurrency(jobs.reduce((a, j) => a + Number(j.invoiced_total || 0), 0))}</span></div>
              <div className="border-t pt-1.5 flex justify-between text-[12px]"><span className="text-muted-foreground">Paid</span><span className="tabular font-semibold text-primary">{formatCurrency(totalSpend)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
