import { useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { MapPin, Clock, DollarSign, ArrowRight, Filter, LayoutGrid, List } from "lucide-react";
import { jobs } from "@/data/mock";
import { formatCurrency, formatAcres, formatOperationType, formatCropType, formatDateShort, formatPricingModel } from "@/lib/format";
import type { OperationType } from "@/types/domain";
import { cn } from "@/lib/utils";

const operationFilters: (OperationType | "all")[] = ["all", "spraying", "planting", "harvest", "tillage", "hauling", "soil_sampling", "fertilizing"];
const marketplaceJobs = jobs.filter(j => ["requested", "quoted", "scheduled"].includes(j.status));

export default function Marketplace() {
  const [filter, setFilter] = useState<string>("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = filter === "all" ? marketplaceJobs : marketplaceJobs.filter(j => j.operationType === filter);

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

        {filtered.length === 0 ? (
          <div className="rounded-xl bg-card shadow-card p-12 text-center">
            <Filter size={32} className="mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="font-semibold mb-1">No jobs match this filter</h3>
            <p className="text-sm text-muted-foreground">Try a different operation type or check back later.</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map(job => (
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
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin size={12} /><span className="truncate">{formatAcres(job.totalAcres)}</span></div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock size={12} /><span>by {formatDateShort(job.deadline)}</span></div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><DollarSign size={12} /><span>{formatCurrency(job.baseRate)}/{formatPricingModel(job.pricingModel).toLowerCase().replace("per ", "")}</span></div>
                </div>
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
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-card shadow-card divide-y">
            {filtered.map(job => (
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
