import { useMemo } from "react";
import AppShell from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Clock, Navigation, Cloud } from "lucide-react";
import { jobs, operators } from "@/data/mock";
import { formatOperationType, formatAcres } from "@/lib/format";
import { cn } from "@/lib/utils";
import { optimizeRoute, clusterJobs, type RouteStop, type GeoPoint } from "@/lib/routing";
import { RouteStatsBar } from "@/components/intelligence/RouteContext";

const OPERATOR_ID = "usr-3";
const operator = operators.find(o => o.userId === OPERATOR_ID)!;
const operatorBase: GeoPoint = { lat: operator.baseLat!, lng: operator.baseLng! };

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
  // Convert jobs to route stops and optimize per day
  const routesByDay = useMemo(() => {
    const result: Record<string, ReturnType<typeof optimizeRoute>> = {};
    for (const [day, dayJobs] of Object.entries(grouped)) {
      const stops: RouteStop[] = dayJobs.map(j => ({
        id: j.id,
        label: j.fields[0]?.fieldName || j.title,
        location: j.fields[0] ? { lat: 41.45 + Math.random() * 0.03, lng: -96.15 - Math.random() * 0.05 } : operatorBase,
        acreage: j.totalAcres,
        operationType: j.operationType,
        jobId: j.id,
        scheduledStart: j.scheduledStart,
      }));
      result[day] = optimizeRoute(operatorBase, stops);
    }
    return result;
  }, []);

  // Clusters across all scheduled jobs
  const allStops: RouteStop[] = useMemo(() => {
    return myJobs.map(j => ({
      id: j.id,
      label: j.fields[0]?.fieldName || j.title,
      location: { lat: 41.45 + Math.random() * 0.03, lng: -96.15 - Math.random() * 0.05 },
      acreage: j.totalAcres,
      operationType: j.operationType,
      jobId: j.id,
    }));
  }, []);

  const clusters = useMemo(() => clusterJobs(allStops, 15), [allStops]);

  return (
    <AppShell title="Schedule & Route">
      <div className="animate-fade-in space-y-6">
        {/* Clusters summary */}
        {clusters.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {clusters.map(c => (
              <div key={c.id} className="flex items-center gap-1.5 text-xs bg-primary/8 text-primary rounded-full px-3 py-1.5 font-medium">
                <Navigation size={12} />
                {c.label} · {formatAcres(c.totalAcres)}
              </div>
            ))}
          </div>
        )}

        {Object.entries(grouped).length === 0 ? (
          <div className="rounded-xl bg-card shadow-card p-12 text-center">
            <Calendar size={32} className="mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="font-semibold mb-1">No scheduled work</h3>
            <p className="text-sm text-muted-foreground">Check the marketplace for available jobs.</p>
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl">
            {Object.entries(grouped).map(([day, dayJobs]) => {
              const route = routesByDay[day];
              return (
                <div key={day}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Calendar size={14} /> {day}
                    </h3>
                  </div>

                  {/* Route stats bar */}
                  {route && (
                    <RouteStatsBar
                      totalMiles={route.totalMiles}
                      totalMinutes={route.totalMinutes}
                      stopCount={route.stops.length}
                      className="mb-3"
                    />
                  )}

                  <div className="rounded-xl bg-card shadow-card divide-y">
                    {(route?.stops || dayJobs.map((j, i) => ({ id: j.id, label: j.fields[0]?.fieldName || j.title, acreage: j.totalAcres, operationType: j.operationType, jobId: j.id, location: operatorBase }))).map((stop, i) => {
                      const job = dayJobs.find(j => j.id === (stop as any).jobId || j.id === stop.id);
                      const segment = route?.segments[i];
                      return (
                        <div key={stop.id}>
                          {/* Travel segment indicator */}
                          {segment && (
                            <div className="px-4 py-1.5 bg-surface-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                              <Navigation size={10} />
                              {segment.distanceMiles.toFixed(1)} mi · {segment.estimatedMinutes} min
                              {i === 0 && " from shop"}
                            </div>
                          )}
                          <Link to={`/jobs/${stop.jobId || stop.id}`} className="flex items-center gap-4 p-4 hover:bg-surface-2 transition-colors">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">{i + 1}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{stop.label}</p>
                              <p className="text-xs text-muted-foreground">{formatOperationType(stop.operationType)} · {formatAcres(stop.acreage)}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                              {job?.scheduledStart && (
                                <span className="flex items-center gap-1"><Clock size={12} /> {new Date(job.scheduledStart).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                              )}
                              {job && <StatusBadge status={job.status} />}
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
