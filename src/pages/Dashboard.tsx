import AppShell from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Map, Briefcase, DollarSign, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { jobs, fields, fieldStats } from "@/data/mock";
import { formatCurrency, formatAcres, formatOperationType } from "@/lib/format";

const totalAcres = fields.reduce((a, f) => a + f.acreage, 0);
const activeJobs = jobs.filter(j => ["requested", "quoted", "accepted", "scheduled", "in_progress"].includes(j.status));
const totalSpend = Object.values(fieldStats).reduce((a, s) => a + s.totalSpend, 0);
const recentJobs = jobs.slice(0, 6);

export default function Dashboard() {
  return (
    <AppShell title="Dashboard">
      <div className="space-y-6 animate-fade-in">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active Fields" value={String(fields.length)} change={`${fields.filter(f => f.status === "active").length} with active jobs`} changeType="positive" icon={<Map size={20} />} />
          <StatCard label="Open Jobs" value={String(activeJobs.length)} change={`${jobs.filter(j => j.status === "in_progress").length} in progress`} changeType="neutral" icon={<Briefcase size={20} />} />
          <StatCard label="Total Spend" value={formatCurrency(totalSpend)} change="+12.4% vs last year" changeType="positive" icon={<DollarSign size={20} />} />
          <StatCard label="Acres Managed" value={formatAcres(totalAcres)} change={`${fields.length} fields across ${new Set(fields.map(f => f.farmId)).size} farms`} changeType="positive" icon={<TrendingUp size={20} />} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl bg-card shadow-card">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold">Recent Jobs</h2>
              <Button variant="outline" size="sm" asChild>
                <Link to="/jobs"><Plus size={14} /> New Job</Link>
              </Button>
            </div>
            <div className="divide-y">
              {recentJobs.map((job) => (
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

          <div className="space-y-4">
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
    </AppShell>
  );
}
