import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Map, Briefcase, DollarSign, TrendingUp, Plus, ArrowRight, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { jobs, fields, fieldStats } from "@/data/mock";
import { formatCurrency, formatAcres, formatOperationType } from "@/lib/format";

const totalAcres = fields.reduce((a, f) => a + f.acreage, 0);
const activeJobs = jobs.filter(j => ["requested", "quoted", "accepted", "scheduled", "in_progress"].includes(j.status));
const totalSpend = Object.values(fieldStats).reduce((a, s) => a + s.totalSpend, 0);
const pendingApprovals = jobs.filter(j => j.proofSubmitted && !j.proofApproved);
const fieldsNeedingAction = fields.filter(f => f.status === "pending" || f.status === "restricted");
const upcomingJobs = jobs.filter(j => j.scheduledStart && ["scheduled", "accepted"].includes(j.status));
const recentJobs = jobs.slice(0, 6);

export default function GrowerDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Fields" value={String(fields.length)} change={`${fields.filter(f => f.status === "active").length} with active jobs`} changeType="positive" icon={<Map size={20} />} />
        <StatCard label="Open Jobs" value={String(activeJobs.length)} change={`${jobs.filter(j => j.status === "in_progress").length} in progress`} changeType="neutral" icon={<Briefcase size={20} />} />
        <StatCard label="Total Spend" value={formatCurrency(totalSpend)} change="+12.4% vs last year" changeType="positive" icon={<DollarSign size={20} />} />
        <StatCard label="Acres Managed" value={formatAcres(totalAcres)} change={`${fields.length} fields across ${new Set(fields.map(f => f.farmId)).size} farms`} changeType="positive" icon={<TrendingUp size={20} />} />
      </div>

      {/* Alerts row */}
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
                    <span>{j.displayId} — {formatOperationType(j.operationType)}</span>
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
        {/* Recent jobs */}
        <div className="lg:col-span-2 rounded-xl bg-card shadow-card">
          <div className="flex items-center justify-between p-5 border-b">
            <h2 className="font-semibold">Recent Jobs</h2>
            <Button variant="outline" size="sm" asChild>
              <Link to="/jobs"><Plus size={14} /> New Job</Link>
            </Button>
          </div>
          <div className="divide-y">
            {recentJobs.map(job => (
              <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center justify-between p-4 hover:bg-surface-2 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{job.fields[0]?.fieldName || job.title}</p>
                  <p className="text-xs text-muted-foreground">{formatOperationType(job.operationType)} · {job.operatorName || "Unassigned"}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs text-muted-foreground tabular">{formatAcres(job.totalAcres)}</span>
                  <StatusBadge status={job.status} />
                </div>
              </Link>
            ))}
          </div>
          <div className="p-3 border-t">
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" asChild>
              <Link to="/jobs">View all jobs <ArrowRight size={14} /></Link>
            </Button>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Upcoming windows */}
          {upcomingJobs.length > 0 && (
            <div className="rounded-xl bg-card shadow-card p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><Clock size={15} /> Upcoming Work</h2>
              <div className="space-y-2.5">
                {upcomingJobs.slice(0, 3).map(j => (
                  <Link key={j.id} to={`/jobs/${j.id}`} className="block rounded-lg bg-surface-2 p-2.5 hover:bg-surface-3 transition-colors">
                    <p className="text-sm font-medium">{j.fields[0]?.fieldName}</p>
                    <p className="text-xs text-muted-foreground">{formatOperationType(j.operationType)} · {j.operatorName}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="rounded-xl bg-card shadow-card p-5">
            <h2 className="font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link to="/fields"><Map size={14} /> Add Field</Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link to="/jobs"><Briefcase size={14} /> Post a Job</Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link to="/marketplace"><TrendingUp size={14} /> Browse Marketplace</Link>
              </Button>
            </div>
          </div>

          {/* Fields Overview */}
          <div className="rounded-xl bg-card shadow-card p-5">
            <h2 className="font-semibold mb-3">Fields Overview</h2>
            <div className="space-y-2">
              {fields.slice(0, 4).map(f => (
                <Link key={f.id} to={`/fields/${f.id}`} className="flex items-center justify-between py-1.5 text-sm hover:text-primary transition-colors">
                  <span className="truncate">{f.name}</span>
                  <StatusBadge status={f.status} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
