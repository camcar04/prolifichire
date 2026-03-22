import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Briefcase, DollarSign, TrendingUp, ArrowRight, Package,
  MapPin, Clock, CheckCircle2, AlertTriangle, FileText, Truck, Bell,
} from "lucide-react";
import { jobs, fieldPackets, credentials, operators } from "@/data/mock";
import { formatCurrency, formatAcres, formatOperationType, formatDate, formatDateShort } from "@/lib/format";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

// Mock: operator is usr-3 (Mike Brennan)
const OPERATOR_ID = "usr-3";
const operator = operators.find(o => o.userId === OPERATOR_ID)!;
const myJobs = jobs.filter(j => j.operatorId === OPERATOR_ID);
const activeJobs = myJobs.filter(j => ["accepted", "scheduled", "in_progress"].includes(j.status));
const jobsNeedingAction = myJobs.filter(j => j.status === "in_progress" && !j.proofSubmitted);
const jobsToQuote = jobs.filter(j => j.status === "requested" && !j.operatorId);
const packetsReady = fieldPackets.filter(p => p.operatorId === OPERATOR_ID && p.status === "ready");
const expiringCreds = credentials.filter(c => c.operatorId === "op-1" && c.status === "expiring_soon");
const totalEarned = myJobs.reduce((a, j) => a + (j.paidTotal || 0), 0);
const pendingPayout = myJobs.reduce((a, j) => a + (j.invoicedTotal || 0), 0) - totalEarned;

// Mock today's route
const todayRoute = activeJobs.filter(j => j.scheduledStart);

export default function OperatorDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Jobs" value={String(activeJobs.length)} change={`${jobsNeedingAction.length} need action`} changeType={jobsNeedingAction.length > 0 ? "negative" : "positive"} icon={<Briefcase size={20} />} />
        <StatCard label="Packets Ready" value={String(packetsReady.length)} change="Download before dispatch" changeType="neutral" icon={<Package size={20} />} />
        <StatCard label="Earned YTD" value={formatCurrency(totalEarned)} change={`${formatCurrency(pendingPayout)} pending`} changeType="positive" icon={<DollarSign size={20} />} />
        <StatCard label="Jobs Completed" value={String(operator.completedJobs)} change={`${operator.rating}★ · ${operator.reviewCount} reviews`} changeType="positive" icon={<TrendingUp size={20} />} />
      </div>

      {/* Alerts */}
      {(expiringCreds.length > 0 || jobsNeedingAction.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {jobsNeedingAction.length > 0 && (
            <div className="rounded-xl bg-warning/8 border border-warning/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className="text-warning" />
                <h3 className="text-sm font-semibold">{jobsNeedingAction.length} Job{jobsNeedingAction.length > 1 ? "s" : ""} Need Proof of Work</h3>
              </div>
              <div className="space-y-1.5">
                {jobsNeedingAction.map(j => (
                  <Link key={j.id} to={`/jobs/${j.id}`} className="flex items-center justify-between text-sm hover:underline">
                    <span>{j.displayId} — {j.fields[0]?.fieldName}</span>
                    <ArrowRight size={14} />
                  </Link>
                ))}
              </div>
            </div>
          )}
          {expiringCreds.length > 0 && (
            <div className="rounded-xl bg-destructive/8 border border-destructive/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-destructive" />
                <h3 className="text-sm font-semibold">{expiringCreds.length} Credential{expiringCreds.length > 1 ? "s" : ""} Expiring Soon</h3>
              </div>
              <div className="space-y-1.5">
                {expiringCreds.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span>{c.name}</span>
                    <span className="text-xs text-muted-foreground">Exp {formatDateShort(c.expiresAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's route / active jobs */}
        <div className="lg:col-span-2 space-y-5">
          {/* Today's schedule */}
          <div className="rounded-xl bg-card shadow-card">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold flex items-center gap-2"><Truck size={16} /> Today's Route</h2>
              <Button variant="outline" size="sm" asChild>
                <Link to="/schedule">Full Schedule</Link>
              </Button>
            </div>
            {todayRoute.length > 0 ? (
              <div className="divide-y">
                {todayRoute.map((job, i) => (
                  <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center gap-4 p-4 hover:bg-surface-2 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{job.fields[0]?.fieldName}</p>
                      <p className="text-xs text-muted-foreground">{formatOperationType(job.operationType)} · {formatAcres(job.totalAcres)}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {job.travelDistance && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin size={12} /> {job.travelDistance} mi
                        </span>
                      )}
                      <StatusBadge status={job.status} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <Clock size={24} className="mx-auto mb-2 text-muted-foreground/30" />
                No jobs scheduled for today.
              </div>
            )}
          </div>

          {/* Available jobs to quote */}
          <div className="rounded-xl bg-card shadow-card">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold flex items-center gap-2"><FileText size={16} /> Jobs to Quote</h2>
              <Button variant="outline" size="sm" asChild>
                <Link to="/marketplace">Browse All</Link>
              </Button>
            </div>
            {jobsToQuote.length > 0 ? (
              <div className="divide-y">
                {jobsToQuote.slice(0, 4).map(job => (
                  <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center justify-between p-4 hover:bg-surface-2 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.fields[0]?.fieldName} · {formatAcres(job.totalAcres)} · by {formatDateShort(job.deadline)}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-medium tabular">{formatCurrency(job.estimatedTotal)}</span>
                      <Button size="sm" variant="outline">Quote</Button>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">No open jobs in your service area.</div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Packets ready */}
          {packetsReady.length > 0 && (
            <div className="rounded-xl bg-card shadow-card p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><Package size={15} /> Packets Ready</h2>
              <div className="space-y-2.5">
                {packetsReady.map(p => (
                  <Link key={p.id} to={`/packets`} className="block rounded-lg bg-success/8 border border-success/20 p-2.5 hover:bg-success/12 transition-colors">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">v{p.version}</p>
                      <StatusBadge status="ready" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.files.filter(f => f.included).length} files · Ready for download</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
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

          {/* Earnings summary */}
          <div className="rounded-xl bg-card shadow-card p-5">
            <h2 className="font-semibold mb-3">Earnings Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total Earned</span><span className="font-bold tabular text-success">{formatCurrency(totalEarned)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Pending Payout</span><span className="font-medium tabular">{formatCurrency(Math.max(0, pendingPayout))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Completed Jobs</span><span className="font-medium tabular">{myJobs.filter(j => ["completed", "approved", "invoiced", "paid", "closed"].includes(j.status)).length}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
