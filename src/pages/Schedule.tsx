import AppShell from "@/components/layout/AppShell";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/PageSkeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "react-router-dom";
import { Calendar, Clock, Navigation } from "lucide-react";
import { useJobs } from "@/hooks/useJobs";
import { useAuth } from "@/contexts/AuthContext";
import { formatOperationType, formatAcres } from "@/lib/format";

export default function Schedule() {
  const { user } = useAuth();
  const { data: allJobs = [], isLoading } = useJobs();

  const myJobs = allJobs
    .filter(j => j.operator_id === user?.id && j.scheduled_start)
    .sort((a, b) => new Date(a.scheduled_start!).getTime() - new Date(b.scheduled_start!).getTime());

  const grouped = myJobs.reduce<Record<string, typeof myJobs>>((acc, job) => {
    const day = new Date(job.scheduled_start!).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    if (!acc[day]) acc[day] = [];
    acc[day].push(job);
    return acc;
  }, {});

  return (
    <AppShell title="Schedule & Route">
      <div className="animate-fade-in space-y-6">
        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : Object.entries(grouped).length === 0 ? (
          <EmptyState
            icon={<Calendar size={24} />}
            title="No scheduled work"
            description="Check the marketplace for available jobs, or scheduled jobs will appear here."
            action={{ label: "Browse Marketplace", to: "/marketplace" }}
          />
        ) : (
          <div className="space-y-6 max-w-3xl">
            {Object.entries(grouped).map(([day, dayJobs]) => (
              <div key={day}>
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
                  <Calendar size={14} /> {day}
                </h3>
                <div className="rounded-xl bg-card shadow-card divide-y">
                  {dayJobs.map((job, i) => {
                    const jf = (job as any).job_fields?.[0];
                    const fieldName = jf?.fields?.name || job.title;
                    return (
                      <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center gap-4 p-4 hover:bg-surface-2 transition-colors">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{fieldName}</p>
                          <p className="text-xs text-muted-foreground">{formatOperationType(job.operation_type)} · {formatAcres(Number(job.total_acres))}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                          {job.scheduled_start && (
                            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(job.scheduled_start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                          )}
                          <StatusBadge status={job.status} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
