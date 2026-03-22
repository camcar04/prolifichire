import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { useJobs } from "@/hooks/useJobs";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ListSkeleton } from "@/components/shared/PageSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatOperationType, formatAcres } from "@/lib/format";
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "week";

function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const r = new Date(d);
    r.setDate(d.getDate() + i);
    return r;
  });
}

function getMonthDates(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const dates: Date[] = [];
  // prev month fill
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    dates.push(d);
  }
  // current month
  for (let i = 1; i <= last.getDate(); i++) {
    dates.push(new Date(year, month, i));
  }
  // next month fill
  while (dates.length % 7 !== 0) {
    dates.push(new Date(year, month + 1, dates.length - last.getDate() - startDay + 1));
  }
  return dates;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-info/20 text-info border-info/30",
  quoted: "bg-warning/20 text-warning border-warning/30",
  accepted: "bg-primary/20 text-primary border-primary/30",
  scheduled: "bg-primary/20 text-primary border-primary/30",
  in_progress: "bg-success/20 text-success border-success/30",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-muted text-muted-foreground border-border line-through",
};

export default function CalendarView() {
  const { user, activeMode } = useAuth();
  const { data: allJobs = [], isLoading } = useJobs();
  const [view, setView] = useState<ViewMode>("month");
  const [current, setCurrent] = useState(new Date());

  const jobs = useMemo(() => {
    if (activeMode === "operator") {
      return allJobs.filter(j => j.operator_id === user?.id);
    }
    return allJobs.filter(j => j.requested_by === user?.id);
  }, [allJobs, user, activeMode]);

  // Map jobs to date keys
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

  const dates = view === "month" ? getMonthDates(current) : getWeekDates(current);
  const today = dateKey(new Date());

  const navigate = (dir: number) => {
    const d = new Date(current);
    if (view === "month") d.setMonth(d.getMonth() + dir);
    else d.setDate(d.getDate() + dir * 7);
    setCurrent(d);
  };

  const headerLabel = view === "month"
    ? current.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : `Week of ${dates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  return (
    <AppShell title="Calendar">
      <div className="animate-fade-in">
        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate(-1)}><ChevronLeft size={14} /></Button>
            <h2 className="text-sm font-semibold min-w-[140px] text-center">{headerLabel}</h2>
            <Button size="sm" variant="outline" onClick={() => navigate(1)}><ChevronRight size={14} /></Button>
            <Button size="sm" variant="ghost" className="text-[11px]" onClick={() => setCurrent(new Date())}>Today</Button>
          </div>
          <div className="flex border rounded-md overflow-hidden">
            <button
              className={cn("px-3 py-1 text-[11px] font-medium transition-colors", view === "month" ? "bg-primary text-primary-foreground" : "hover:bg-surface-2")}
              onClick={() => setView("month")}
            >Month</button>
            <button
              className={cn("px-3 py-1 text-[11px] font-medium transition-colors", view === "week" ? "bg-primary text-primary-foreground" : "hover:bg-surface-2")}
              onClick={() => setView("week")}
            >Week</button>
          </div>
        </div>

        {isLoading ? (
          <ListSkeleton rows={5} />
        ) : (
          <div className="rounded-lg bg-card border overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} className="text-[10px] font-semibold text-muted-foreground text-center py-1.5 border-r last:border-r-0">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {dates.map((d, i) => {
                const key = dateKey(d);
                const isToday = key === today;
                const isCurrentMonth = d.getMonth() === current.getMonth();
                const dayJobs = jobsByDate[key] || [];

                return (
                  <div
                    key={i}
                    className={cn(
                      "min-h-[80px] sm:min-h-[100px] border-r border-b last:border-r-0 p-1",
                      !isCurrentMonth && "bg-surface-2/50",
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
                      {dayJobs.slice(0, view === "week" ? 5 : 3).map((j: any) => (
                        <Link
                          key={j.id}
                          to={`/jobs/${j.id}`}
                          className={cn(
                            "block rounded px-1 py-0.5 text-[9px] sm:text-[10px] font-medium truncate border leading-tight",
                            STATUS_COLORS[j.status] || "bg-surface-2"
                          )}
                          title={`${j.display_id} · ${formatOperationType(j.operation_type)}`}
                        >
                          {formatOperationType(j.operation_type).split(" ")[0]}
                        </Link>
                      ))}
                      {dayJobs.length > (view === "week" ? 5 : 3) && (
                        <span className="text-[9px] text-muted-foreground pl-1">+{dayJobs.length - 3} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Day detail — upcoming jobs list */}
        {!isLoading && jobs.length === 0 && (
          <div className="mt-6">
            <EmptyState
              icon={<CalIcon size={24} />}
              title="No scheduled work"
              description={activeMode === "operator" ? "Accept jobs to see them on your calendar." : "Post a job to start scheduling work."}
              action={{ label: activeMode === "operator" ? "Browse Jobs" : "Post a Job", to: activeMode === "operator" ? "/marketplace" : "/signup" }}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
