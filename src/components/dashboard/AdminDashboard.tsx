import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/ui/status-badge";
import { DashboardSkeleton } from "@/components/shared/PageSkeleton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Users, Briefcase, DollarSign, Map, AlertTriangle,
  ArrowRight, Activity, Shield, TrendingUp, BarChart3, ShieldCheck,
} from "lucide-react";
import { formatCurrency, formatOperationType, formatDate, formatRelative } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { CompliancePanel } from "@/components/admin/CompliancePanel";

const STATUS_COLORS: Record<string, string> = {
  requested: "hsl(38, 92%, 50%)",
  quoted: "hsl(210, 60%, 50%)",
  accepted: "hsl(152, 50%, 38%)",
  scheduled: "hsl(152, 38%, 28%)",
  in_progress: "hsl(36, 80%, 52%)",
  completed: "hsl(152, 50%, 44%)",
  paid: "hsl(152, 60%, 32%)",
  closed: "hsl(160, 6%, 70%)",
};

function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [
        { count: jobCount },
        { count: fieldCount },
        { count: userCount },
        { count: farmCount },
        { data: jobs },
        { data: recentAudit },
        { data: disputes },
      ] = await Promise.all([
        supabase.from("jobs").select("*", { count: "exact", head: true }),
        supabase.from("fields").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("farms").select("*", { count: "exact", head: true }),
        supabase.from("jobs").select("id, status, operation_type, display_id, title, created_at, estimated_total, total_acres, paid_total").order("created_at", { ascending: false }).limit(50),
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(12),
        supabase.from("disputes").select("*").order("created_at", { ascending: false }).limit(10),
      ]);

      const allJobs = jobs || [];
      const jobsByStatus: Record<string, number> = {};
      const jobsByType: Record<string, number> = {};
      let totalRevenue = 0;
      let totalPaid = 0;
      let totalAcres = 0;

      allJobs.forEach((j: any) => {
        jobsByStatus[j.status] = (jobsByStatus[j.status] || 0) + 1;
        jobsByType[j.operation_type] = (jobsByType[j.operation_type] || 0) + 1;
        totalRevenue += Number(j.estimated_total || 0);
        totalPaid += Number(j.paid_total || 0);
        totalAcres += Number(j.total_acres || 0);
      });

      const statusChartData = Object.entries(jobsByStatus)
        .sort((a, b) => b[1] - a[1])
        .map(([status, count]) => ({ name: status, value: count }));

      const typeChartData = Object.entries(jobsByType)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => ({ name: formatOperationType(type), count }));

      const openDisputes = (disputes || []).filter((d: any) => d.status === "opened" || d.status === "under_review");
      const fillRate = allJobs.length > 0
        ? Math.round((allJobs.filter((j: any) => ["accepted", "scheduled", "in_progress", "completed", "approved", "paid", "closed"].includes(j.status)).length / allJobs.length) * 100)
        : 0;

      return {
        jobCount: jobCount || 0,
        fieldCount: fieldCount || 0,
        userCount: userCount || 0,
        farmCount: farmCount || 0,
        jobs: allJobs,
        recentAudit: recentAudit || [],
        disputes: disputes || [],
        openDisputes,
        statusChartData,
        typeChartData,
        totalRevenue,
        totalPaid,
        totalAcres,
        fillRate,
      };
    },
  });
}

export default function AdminDashboard() {
  const { data, isLoading } = useAdminStats();

  if (isLoading || !data) return <DashboardSkeleton />;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <Shield size={15} className="text-primary" />
        <h2 className="text-[14px] font-bold">Platform Administration</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Jobs" value={String(data.jobCount)} change={`${data.fillRate}% fill rate`} changeType={data.fillRate > 50 ? "positive" : "neutral"} icon={<Briefcase size={14} />} />
        <StatCard label="Fields" value={String(data.fieldCount)} change={`${data.farmCount} farms`} changeType="neutral" icon={<Map size={14} />} />
        <StatCard label="Users" value={String(data.userCount)} change="Registered" changeType="positive" icon={<Users size={14} />} />
        <StatCard label="Revenue" value={formatCurrency(data.totalRevenue)} change={`${formatCurrency(data.totalPaid)} paid`} changeType="positive" icon={<DollarSign size={14} />} />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Jobs by type */}
        <div className="rounded bg-card border p-4">
          <h3 className="text-[13px] font-semibold mb-3 flex items-center gap-1.5"><BarChart3 size={13} /> Jobs by Operation Type</h3>
          {data.typeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.typeChartData} layout="vertical" margin={{ left: 0, right: 12 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                <Bar dataKey="count" fill="hsl(152, 38%, 22%)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-[12px] text-muted-foreground text-center py-8">No job data yet.</p>
          )}
        </div>

        {/* Jobs by status */}
        <div className="rounded bg-card border p-4">
          <h3 className="text-[13px] font-semibold mb-3 flex items-center gap-1.5"><TrendingUp size={13} /> Jobs by Status</h3>
          {data.statusChartData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={data.statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60} strokeWidth={1}>
                    {data.statusChartData.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.name] || `hsl(${(i * 40) % 360}, 50%, 50%)`} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1">
                {data.statusChartData.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.name] || "hsl(0,0%,70%)" }} />
                      <StatusBadge status={s.name} />
                    </div>
                    <span className="font-medium tabular">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground text-center py-8">No job data yet.</p>
          )}
        </div>
      </div>

      {/* Disputes alert */}
      {data.openDisputes.length > 0 && (
        <div className="rounded bg-destructive/5 border border-destructive/15 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={13} className="text-destructive" />
            <h3 className="text-[12px] font-semibold">Open Disputes ({data.openDisputes.length})</h3>
          </div>
          <div className="space-y-1.5">
            {data.openDisputes.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between text-[12px] bg-background rounded px-3 py-2">
                <div>
                  <span className="font-medium">{d.display_id}</span>
                  <span className="text-muted-foreground ml-1.5">— {d.reason}</span>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent jobs + audit */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded bg-card border">
          <div className="flex items-center justify-between px-4 py-2.5 border-b">
            <h3 className="text-[13px] font-semibold flex items-center gap-1.5"><Briefcase size={13} /> Recent Jobs</h3>
            <Button variant="ghost" size="sm" className="h-6 text-[11px]" asChild>
              <Link to="/jobs">View all</Link>
            </Button>
          </div>
          <div className="divide-y max-h-80 overflow-auto">
            {data.jobs.slice(0, 8).map((job: any) => (
              <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center justify-between px-4 py-2 hover:bg-surface-2 transition-colors">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium truncate">{job.display_id} · {job.title}</p>
                  <p className="text-[10px] text-muted-foreground">{formatOperationType(job.operation_type)} · {formatRelative(job.created_at)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-medium tabular">{formatCurrency(Number(job.estimated_total))}</span>
                  <StatusBadge status={job.status} />
                </div>
              </Link>
            ))}
            {data.jobs.length === 0 && (
              <div className="p-6 text-center text-[12px] text-muted-foreground">No jobs in the platform yet.</div>
            )}
          </div>
        </div>

        <div className="rounded bg-card border">
          <div className="px-4 py-2.5 border-b">
            <h3 className="text-[13px] font-semibold flex items-center gap-1.5"><Activity size={13} /> Audit Log</h3>
          </div>
          <div className="divide-y max-h-80 overflow-auto">
            {data.recentAudit.map((log: any) => (
              <div key={log.id} className="px-4 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-medium truncate">{log.action}</p>
                  <span className="text-[9px] text-muted-foreground bg-surface-2 rounded px-1.5 py-0.5 shrink-0">{log.entity_type}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{log.description}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  {log.user_name && `${log.user_name} · `}{formatRelative(log.created_at)}
                </p>
              </div>
            ))}
            {data.recentAudit.length === 0 && (
              <div className="p-6 text-center text-[12px] text-muted-foreground">No audit events yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Compliance */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={14} className="text-primary" />
          <h3 className="text-[13px] font-semibold">Compliance & Credentials</h3>
        </div>
        <CompliancePanel />
      </div>
    </div>
  );
}
