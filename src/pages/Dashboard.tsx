import AppShell from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge, type Status } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Map, Briefcase, DollarSign, TrendingUp, Plus, ArrowRight } from "lucide-react";

const recentJobs: { id: string; field: string; type: string; operator: string; status: Status; acres: number }[] = [
  { id: "JOB-1847", field: "North 80 — Section 14", type: "Spraying", operator: "AgriPro Services", status: "in_progress", acres: 78.4 },
  { id: "JOB-1846", field: "River Bottom — East", type: "Planting", operator: "Heartland Custom", status: "completed", acres: 124.2 },
  { id: "JOB-1845", field: "Hilltop Quarter", type: "Harvest", operator: "Prairie Partners", status: "scheduled", acres: 156.8 },
  { id: "JOB-1844", field: "County Line Strip", type: "Spraying", operator: "AgriPro Services", status: "approved", acres: 42.1 },
  { id: "JOB-1843", field: "West Bottoms", type: "Tillage", operator: "Heartland Custom", status: "paid", acres: 89.6 },
];

export default function Dashboard() {
  return (
    <AppShell title="Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active Fields" value="23" change="+3 this season" changeType="positive" icon={<Map size={20} />} />
          <StatCard label="Open Jobs" value="8" change="2 need attention" changeType="negative" icon={<Briefcase size={20} />} />
          <StatCard label="Revenue (YTD)" value="$184,720" change="+12.4% vs last year" changeType="positive" icon={<DollarSign size={20} />} />
          <StatCard label="Acres Managed" value="3,847" change="+640 ac this year" changeType="positive" icon={<TrendingUp size={20} />} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Jobs */}
          <div className="lg:col-span-2 rounded-xl bg-card shadow-card">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold">Recent Jobs</h2>
              <Button variant="outline" size="sm" asChild>
                <Link to="/jobs"><Plus size={14} /> New Job</Link>
              </Button>
            </div>
            <div className="divide-y">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/fields/north-80`}
                  className="flex items-center justify-between p-4 hover:bg-surface-2 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{job.field}</p>
                      <p className="text-xs text-muted-foreground">{job.type} · {job.operator}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs text-muted-foreground tabular">{job.acres} ac</span>
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

          {/* Quick Actions & Field Map Placeholder */}
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
              <h2 className="font-semibold mb-3">Field Overview</h2>
              <div className="map-container bg-surface-3 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Map size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Interactive map</p>
                  <p className="text-xs">Connect a map provider to view fields</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
