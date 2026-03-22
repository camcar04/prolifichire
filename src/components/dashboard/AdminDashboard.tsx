import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/ui/status-badge";
import { DashboardSkeleton } from "@/components/shared/PageSkeleton";
import { Link } from "react-router-dom";
import {
  Users, Briefcase, DollarSign, Map, TrendingUp, AlertTriangle,
  ArrowRight, Activity, Shield, FileText,
} from "lucide-react";
import { formatCurrency, formatOperationType, formatDate } from "@/lib/format";

function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [
        { count: jobCount },
        { count: fieldCount },
        { count: userCount },
        { data: jobs },
        { data: recentAudit },
        { data: disputes },
      ] = await Promise.all([
        supabase.from("jobs").select("*", { count: "exact", head: true }),
        supabase.from("fields").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("jobs").select("id, status, operation_type, display_id, title, created_at, estimated_total").order("created_at", { ascending: false }).limit(20),
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(15),
        supabase.from("disputes").select("*").order("created_at", { ascending: false }).limit(10),
      ]);

      const jobsByStatus: Record<string, number> = {};
      const jobsByType: Record<string, number> = {};
      let totalRevenue = 0;
      (jobs || []).forEach((j: any) => {
        jobsByStatus[j.status] = (jobsByStatus[j.status] || 0) + 1;
        jobsByType[j.operation_type] = (jobsByType[j.operation_type] || 0) + 1;
        totalRevenue += Number(j.estimated_total || 0);
      });

      return {
        jobCount: jobCount || 0,
        fieldCount: fieldCount || 0,
        userCount: userCount || 0,
        jobs: jobs || [],
        recentAudit: recentAudit || [],
        disputes: disputes || [],
        jobsByStatus,
        jobsByType,
        totalRevenue,
      };
    },
  });
}

export default function AdminDashboard() {
  const { data, isLoading } = useAdminStats();

  if (isLoading || !data) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <Shield size={18} className="text-primary" />
        <h2 className="text-lg font-bold">Platform Administration</h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Jobs" value={String(data.jobCount)} change={`${Object.keys(data.jobsByStatus).length} statuses`} changeType="neutral" icon={<Briefcase size={20} />} />
        <StatCard label="Total Fields" value={String(data.fieldCount)} change="Across all farms" changeType="positive" icon={<Map size={20} />} />
        <StatCard label="Users" value={String(data.userCount)} change="Registered accounts" changeType="positive" icon={<Users size={20} />} />
        <StatCard label="Revenue Pipeline" value={formatCurrency(data.totalRevenue)} change="Estimated from recent jobs" changeType="positive" icon={<DollarSign size={20} />} />
      </div>

      {/* Jobs by status breakdown */}
      {Object.keys(data.jobsByStatus).length > 0 && (
        <div className="rounded-xl bg-card shadow-card p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp size={15} /> Jobs by Status</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.jobsByStatus).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2 bg-surface-2 rounded-lg px-3 py-2">
                <StatusBadge status={status} />
                <span className="text-sm font-medium tabular">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open disputes */}
      {data.disputes.length > 0 && (
        <div className="rounded-xl bg-destructive/5 border border-destructive/15 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-destructive" />
            <h3 className="text-sm font-semibold">Open Disputes ({data.disputes.filter((d: any) => d.status === "opened" || d.status === "under_review").length})</h3>
          </div>
          <div className="space-y-2">
            {data.disputes.filter((d: any) => d.status === "opened" || d.status === "under_review").map((d: any) => (
              <div key={d.id} className="flex items-center justify-between text-sm bg-background rounded-lg p-3">
                <div>
                  <p className="font-medium">{d.display_id} — {d.reason}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(d.created_at)}</p>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent jobs */}
        <div className="rounded-xl bg-card shadow-card">
          <div className="p-4 border-b">
            <h3 className="font-semibold flex items-center gap-2"><Briefcase size={15} /> Recent Jobs</h3>
          </div>
          <div className="divide-y">
            {data.jobs.slice(0, 10).map((job: any) => (
              <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center justify-between p-3.5 hover:bg-surface-2 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{job.display_id} · {job.title}</p>
                  <p className="text-xs text-muted-foreground">{formatOperationType(job.operation_type)} · {formatDate(job.created_at)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-medium tabular">{formatCurrency(Number(job.estimated_total))}</span>
                  <StatusBadge status={job.status} />
                </div>
              </Link>
            ))}
            {data.jobs.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">No jobs in the platform yet.</div>
            )}
          </div>
        </div>

        {/* Audit log */}
        <div className="rounded-xl bg-card shadow-card">
          <div className="p-4 border-b">
            <h3 className="font-semibold flex items-center gap-2"><Activity size={15} /> Audit Log</h3>
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {data.recentAudit.map((log: any) => (
              <div key={log.id} className="p-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{log.action}</p>
                  <span className="text-[10px] text-muted-foreground bg-surface-2 rounded px-1.5 py-0.5">{log.entity_type}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{log.description}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {log.user_name && `${log.user_name} · `}{formatDate(log.created_at)}
                </p>
              </div>
            ))}
            {data.recentAudit.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">No audit events yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
