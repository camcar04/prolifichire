import { useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/PageSkeleton";
import { MapPin, Clock, DollarSign, ArrowRight, Filter, LayoutGrid, List } from "lucide-react";
import { useMarketplaceJobs } from "@/hooks/useJobs";
import { formatCurrency, formatAcres, formatOperationType, formatCropType, formatDateShort, formatPricingModel } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
import type { OperationType } from "@/types/domain";
import { cn } from "@/lib/utils";

const operationFilters: (OperationType | "all")[] = ["all", "spraying", "planting", "harvest", "tillage", "hauling", "soil_sampling", "fertilizing"];

export default function Marketplace() {
  const { activeMode } = useAuth();
  const { data: allJobs = [], isLoading } = useMarketplaceJobs();
  const [filter, setFilter] = useState<string>("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = filter === "all" ? allJobs : allJobs.filter(j => j.operation_type === filter);

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

        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Filter size={24} />}
            title={filter === "all" ? "No jobs available" : "No jobs match this filter"}
            description={filter === "all"
              ? "No jobs have been posted yet. Check back later or post your own."
              : "Try a different operation type or check back later."}
          />
        ) : view === "grid" ? (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map(job => {
              const jf = (job as any).job_fields?.[0];
              const fieldName = jf?.fields?.name || "—";
              const crop = jf?.fields?.crop || "other";

              return (
                <div key={job.id} className="rounded-xl bg-card shadow-card hover:shadow-card-hover transition-[box-shadow] duration-300 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="inline-block text-xs font-medium text-primary bg-primary/8 rounded-full px-2 py-0.5 mb-2">
                        {formatOperationType(job.operation_type)}
                      </span>
                      <h3 className="font-semibold text-sm">{job.title}</h3>
                      <p className="text-sm text-muted-foreground">{fieldName}</p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin size={12} /><span className="truncate">{formatAcres(Number(job.total_acres))}</span></div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock size={12} /><span>by {formatDateShort(job.deadline)}</span></div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><DollarSign size={12} /><span>{formatCurrency(Number(job.base_rate))}/{formatPricingModel(job.pricing_model).toLowerCase().replace("per ", "")}</span></div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <span className="text-sm tabular font-medium">{formatCropType(crop)}</span>
                      {job.split_payment && <span className="text-[10px] text-info font-medium bg-info/8 px-1.5 py-0.5 rounded">Split Pay</span>}
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
            {filtered.map(job => {
              const jf = (job as any).job_fields?.[0];
              const fieldName = jf?.fields?.name || "—";
              return (
                <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center justify-between p-4 hover:bg-surface-2 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{fieldName} · {formatOperationType(job.operation_type)} · {formatAcres(Number(job.total_acres))}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-sm tabular font-medium">{formatCurrency(Number(job.estimated_total))}</span>
                    <StatusBadge status={job.status} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
