import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { useJobs } from "@/hooks/useJobs";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ListSkeleton } from "@/components/shared/PageSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatOperationType, formatAcres, formatDate } from "@/lib/format";
import { ChevronLeft, ChevronRight, Calendar as CalIcon, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "week" | "day";

function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const r = new Date(d);
    r.setDate(d.getDate() + i);
    return r;
  });
}

function getMonthDates(date: Date): Date[] {
  const year = date.getFullYear(), month = date.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const dates: Date[] = [];
  for (let i = first.getDay() - 1; i >= 0; i--) dates.push(new Date(year, month, -i));
  for (let i = 1; i <= last.getDate(); i++) dates.push(new Date(year, month, i));
  while (dates.length % 7 !== 0) dates.push(new Date(year, month + 1, dates.length - last.getDate() - first.getDay() + 1));
  return dates;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  requested: "bg-info/20 text-info border-info/30",
  quoted: "bg-warning/20 text-warning border-warning/30",
  accepted: "bg-primary/15 text-primary border-primary/30",
  scheduled: "bg-primary/20 text-primary border-primary/30",
  in_progress: "bg-success/20 text-success border-success/30",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20 line-through",
};

export default function CalendarView() {
  const { user, activeMode } = useAuth();
  const { data: allJobs = [], isLoading } = useJobs();
  const [view, setView] = useState<ViewMode>("month");
  const [current, setCurrent] = useState(new Date());

  const jobs = useMemo(() => {
    if (activeMode === "operator") return allJobs.filter(j => j.operator_id === user?.id);
    return allJobs.filter(j => j.requested_by === user?.id);
  }, [allJobs, user, activeMode]);

  const jobsByDate = useMemo(() => {
    const map: Record<string, typeof jobs> = {};
    jobs.forEach(j => {
      const dateStr = j.scheduled_start || j.deadline;
      if (!dateStr) return;
      const key = dateKey(new Date(dateStr));
      if (!map[key]) map[key] = [];
      map[key].push(j);
    });
    return map;
  }, [jobs]);

  const dates = view === "month" ? getMonthDates(current) : view === "week" ? getWeekDates(current) : [current];
  const today = dateKey(new Date());

  const navigate = (dir: number) => {
    const d = new Date(current);
    if (view === "month") d.setMonth(d.getMonth() + dir);
    else if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCurrent(d);
  };

  const headerLabel = view === "month"
    ? current.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : view === "week"
    ? `Week of ${dates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    : current.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const dayJobs = view === "day" ? (jobsByDate[dateKey(current)] || []) : [];

  return (
    <AppShell title="Calendar">
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate(-1)}><ChevronLeft size={14} /></Button>
            <h2 className="text-sm font-semibold min-w-[160px] text-center">{headerLabel}</h2>
            <Button size="sm" variant="outline" onClick={() => navigate(1)}><ChevronRight size={14} /></Button>
            <Button size="sm" variant="ghost" className="text-[11px]" onClick={() => setCurrent(new Date())}>Today</Button>
          </div>
          <div className="flex border rounded-md overflow-hidden">
            {(["month", "week", "day"] as ViewMode[]).map(v => (
              <button
                key={v}
                className={cn("px-3 py-1 text-[11px] font-medium transition-colors capitalize", view === v ? "bg-primary text-primary-foreground" : "hover:bg-surface-2")}
                onClick={() => setView(v)}
              >{v}</button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <ListSkeleton rows={5} />
        ) : view === "day" ? (
          /* Day / Agenda View */
          <div className="space-y-2">
            {dayJobs.length === 0 ? (
              <div className="rounded-lg bg-card border p-8 text-center">
                <CalIcon size={20} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No work scheduled for this day</p>
              </div>
            ) : (
              dayJobs.map((j: any) => {
                const field = j.job_fields?.[0]?.fields;
                return (
                  <Link
                    key={j.id}
                    to={`/jobs/${j.id}`}
                    className="flex items-center gap-3 rounded-lg bg-card border p-3 hover:bg-surface-2 transition-colors"
                  >
                    <div className={cn("h-2 w-2 rounded-full shrink-0", j.status === "in_progress" ? "bg-success" : j.status === "cancelled" ? "bg-destructive" : "bg-primary")} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-medium">{j.display_id} · {formatOperationType(j.operation_type)}</p>
                        <StatusBadge status={j.status} />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {field?.name || j.title} · {formatAcres(Number(j.total_acres))}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                        {j.scheduled_start && (
                          <span className="flex items-center gap-0.5"><Clock size={9} /> {new Date(j.scheduled_start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                        )}
                        {field?.centroid_lat && (
                          <span className="flex items-center gap-0.5"><MapPin size={9} /> {field.name}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        ) : (
          /* Month / Week grid */
          <div className="rounded-lg bg-card border overflow-hidden">
            <div className="grid grid-cols-7 border-b">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} className="text-[10px] font-semibold text-muted-foreground text-center py-1.5 border-r last:border-r-0">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {dates.map((d, i) => {
                const key = dateKey(d);
                const isToday = key === today;
                const isCurrentMonth = d.getMonth() === current.getMonth();
                const dJobs = jobsByDate[key] || [];
                const maxShow = view === "week" ? 5 : 3;

                return (
                  <button
                    key={i}
                    onClick={() => { setCurrent(d); setView("day"); }}
                    className={cn(
                      "min-h-[80px] sm:min-h-[100px] border-r border-b last:border-r-0 p-1 text-left hover:bg-surface-2/50 transition-colors",
                      !isCurrentMonth && "bg-surface-2/30",
                      view === "week" && "min-h-[120px]"
                    )}
                  >
                    <div className={cn(
                      "text-[11px] font-medium mb-0.5 h-5 w-5 rounded-full flex items-center justify-center",
                      isToday && "bg-primary text-primary-foreground",
                      !isToday && !isCurrentMonth && "text-muted-foreground/40",
                      !isToday && isCurrentMonth && "text-foreground"
                    )}>
                      {d.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {dJobs.slice(0, maxShow).map((j: any) => (
                        <Link
                          key={j.id}
                          to={`/jobs/${j.id}`}
                          onClick={e => e.stopPropagation()}
                          className={cn(
                            "block rounded px-1 py-0.5 text-[9px] sm:text-[10px] font-medium truncate border leading-tight",
                            STATUS_COLORS[j.status] || "bg-surface-2"
                          )}
                          title={`${j.display_id} · ${formatOperationType(j.operation_type)}`}
                        >
                          {formatOperationType(j.operation_type).split(" ")[0]}
                        </Link>
                      ))}
                      {dJobs.length > maxShow && (
                        <span className="text-[9px] text-muted-foreground pl-1">+{dJobs.length - maxShow} more</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!isLoading && jobs.length === 0 && (
          <div className="mt-6">
            <EmptyState
              icon={<CalIcon size={24} />}
              title="No scheduled work"
              description={activeMode === "operator" ? "Accept jobs to see them on your calendar." : "Post a job to start scheduling work."}
              action={{ label: activeMode === "operator" ? "Browse Jobs" : "Create a Job", to: activeMode === "operator" ? "/marketplace" : "/dashboard" }}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
