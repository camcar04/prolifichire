import AppShell from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Clock } from "lucide-react";
import { jobs } from "@/data/mock";
import { formatOperationType, formatAcres, formatDate, formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";

const OPERATOR_ID = "usr-3";
const myJobs = jobs
  .filter(j => j.operatorId === OPERATOR_ID && j.scheduledStart)
  .sort((a, b) => new Date(a.scheduledStart!).getTime() - new Date(b.scheduledStart!).getTime());

// Group by date
const grouped = myJobs.reduce<Record<string, typeof myJobs>>((acc, job) => {
  const day = new Date(job.scheduledStart!).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  if (!acc[day]) acc[day] = [];
  acc[day].push(job);
  return acc;
}, {});

export default function Schedule() {
  return (
    <AppShell title="Schedule & Route">
      <div className="animate-fade-in max-w-3xl">
        {Object.entries(grouped).length === 0 ? (
          <div className="rounded-xl bg-card shadow-card p-12 text-center">
            <Calendar size={32} className="mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="font-semibold mb-1">No scheduled work</h3>
            <p className="text-sm text-muted-foreground">Check the marketplace for available jobs.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([day, dayJobs]) => (
              <div key={day}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Calendar size={14} /> {day}
                </h3>
                <div className="rounded-xl bg-card shadow-card divide-y">
                  {dayJobs.map((job, i) => (
                    <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center gap-4 p-4 hover:bg-surface-2 transition-colors">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{job.fields[0]?.fieldName}</p>
                        <p className="text-xs text-muted-foreground">{formatOperationType(job.operationType)} · {formatAcres(job.totalAcres)}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                        {job.travelDistance && (
                          <span className="flex items-center gap-1"><MapPin size={12} /> {job.travelDistance} mi</span>
                        )}
                        {job.scheduledStart && (
                          <span className="flex items-center gap-1"><Clock size={12} /> {new Date(job.scheduledStart).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                        )}
                        <StatusBadge status={job.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
