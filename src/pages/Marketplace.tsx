import { useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { RouteContextBadge } from "@/components/intelligence/RouteContext";
import { MapPin, Clock, DollarSign, ArrowRight, Filter, LayoutGrid, List, CheckCircle2 } from "lucide-react";
import { jobs, operators } from "@/data/mock";
import { formatCurrency, formatAcres, formatOperationType, formatCropType, formatDateShort, formatPricingModel } from "@/lib/format";
import { haversineDistance, isRouteCompatible, type RouteStop, type GeoPoint } from "@/lib/routing";
import { useAuth } from "@/contexts/AuthContext";
import type { OperationType } from "@/types/domain";
import { cn } from "@/lib/utils";

const operationFilters: (OperationType | "all")[] = ["all", "spraying", "planting", "harvest", "tillage", "hauling", "soil_sampling", "fertilizing"];
const marketplaceJobs = jobs.filter(j => ["requested", "quoted", "scheduled"].includes(j.status));

// Mock operator location for route context
const OPERATOR_ID = "usr-3";
const operator = operators.find(o => o.userId === OPERATOR_ID);
const operatorBase: GeoPoint | null = operator?.baseLat ? { lat: operator.baseLat, lng: operator.baseLng! } : null;

// Existing scheduled stops for route compatibility
const existingStops: RouteStop[] = jobs
  .filter(j => j.operatorId === OPERATOR_ID && ["scheduled", "in_progress"].includes(j.status) && j.fields[0])
  .map(j => ({
    id: j.id,
    label: j.fields[0]?.fieldName || j.title,
    location: { lat: 41.45, lng: -96.15 },
    acreage: j.totalAcres,
    operationType: j.operationType,
    jobId: j.id,
  }));

export default function Marketplace() {
  const { activeMode } = useAuth();
  const [filter, setFilter] = useState<string>("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = filter === "all" ? marketplaceJobs : marketplaceJobs.filter(j => j.operationType === filter);

  // Sort by distance for operators
  const sorted = activeMode === "operator" && operatorBase
    ? [...filtered].sort((a, b) => {
        const aLoc = a.fields[0] ? { lat: 41.45 + Math.random() * 0.01, lng: -96.15 } : operatorBase;
        const bLoc = b.fields[0] ? { lat: 41.45 + Math.random() * 0.01, lng: -96.15 } : operatorBase;
        return haversineDistance(operatorBase, aLoc) - haversineDistance(operatorBase, bLoc);
      })
    : filtered;

  return (
    <AppShell title="Marketplace">
      <div className="animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            {operationFilters.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("px-3 py-1.5 rounded-full text-sm font-medium transition-colors active:scale-[0.97]",
                  filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}>
                {f === "all" ? "All" : formatOperationType(f)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setView("grid")}><LayoutGrid size={15} /></Button>
            <Button variant={view === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setView("list")}><List size={15} /></Button>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-xl bg-card shadow-card p-12 text-center">
            <Filter size={32} className="mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="font-semibold mb-1">No jobs match this filter</h3>
            <p className="text-sm text-muted-foreground">Try a different operation type or check back later.</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid md:grid-cols-2 gap-4">
            {sorted.map(job => {
              // Route compatibility for operator mode
              const fieldLoc: GeoPoint = { lat: 41.45 + Math.random() * 0.02, lng: -96.15 - Math.random() * 0.03 };
              const routeCheck = activeMode === "operator" && operatorBase
                ? isRouteCompatible(operatorBase, existingStops, fieldLoc)
                : null;
              const distFromBase = operatorBase ? haversineDistance(operatorBase, fieldLoc) : null;

              return (
                <div key={job.id} className="rounded-xl bg-card shadow-card hover:shadow-card-hover transition-[box-shadow] duration-300 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="inline-block text-xs font-medium text-primary bg-primary/8 rounded-full px-2 py-0.5 mb-2">
                        {formatOperationType(job.operationType)}
                      </span>
                      <h3 className="font-semibold text-sm">{job.title}</h3>
                      <p className="text-sm text-muted-foreground">{job.fields[0]?.fieldName}</p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin size={12} /><span className="truncate">{formatAcres(job.totalAcres)}</span></div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock size={12} /><span>by {formatDateShort(job.deadline)}</span></div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><DollarSign size={12} /><span>{formatCurrency(job.baseRate)}/{formatPricingModel(job.pricingModel).toLowerCase().replace("per ", "")}</span></div>
                  </div>

                  {/* Route context for operators */}
                  {activeMode === "operator" && distFromBase != null && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      <span className="text-[11px] text-muted-foreground bg-surface-2 rounded-full px-2 py-0.5">
                        <MapPin size={10} className="inline mr-0.5" /> {distFromBase.toFixed(1)} mi
                      </span>
                      {routeCheck?.compatible && (
                        <span className="text-[11px] text-success bg-success/8 rounded-full px-2 py-0.5 font-medium">
                          <CheckCircle2 size={10} className="inline mr-0.5" /> Fits route
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <span className="text-sm tabular font-medium">{formatCropType(job.fields[0]?.crop || "other")}</span>
                      {job.splitPayment && <span className="text-[10px] text-info font-medium bg-info/8 px-1.5 py-0.5 rounded">Split Pay</span>}
                      {job.packetStatus === "ready" && <span className="text-[10px] text-success font-medium bg-success/8 px-1.5 py-0.5 rounded">Packet Ready</span>}
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/jobs/${job.id}`}>Details <ArrowRight size={14} /></Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl bg-card shadow-card divide-y">
            {sorted.map(job => (
              <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center justify-between p-4 hover:bg-surface-2 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.fields[0]?.fieldName} · {formatOperationType(job.operationType)} · {formatAcres(job.totalAcres)}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm tabular font-medium">{formatCurrency(job.estimatedTotal)}</span>
                  <StatusBadge status={job.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
