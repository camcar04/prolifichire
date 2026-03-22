import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const operationFilters: (OperationType | "all")[] = ["all", "spraying", "planting", "harvest", "grain_hauling", "tillage", "hauling", "soil_sampling", "fertilizing", "mowing", "baling", "rock_picking"];

export default function Marketplace() {
  const { activeMode } = useAuth();
  const { data: allJobs = [], isLoading } = useMarketplaceJobs();
  const [filter, setFilter] = useState<string>("all");
  const [view, setView] = useState<"list" | "grid">("list");
  const navigate = useNavigate();

  const filtered = filter === "all" ? allJobs : allJobs.filter(j => j.operation_type === filter);

  return (
    <AppShell title="Marketplace">
      <div className="animate-fade-in">
        {/* Sticky toolbar */}
        <div className="sticky top-12 z-20 -mx-3 sm:-mx-5 px-3 sm:px-5 py-2.5 bg-surface-2/80 backdrop-blur-sm border-b mb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {operationFilters.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={cn("px-2.5 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors active:scale-[0.97]",
                    filter === f ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground border"
                  )}>
                  {f === "all" ? "All" : formatOperationType(f)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-muted-foreground tabular mr-1">{filtered.length} jobs</span>
              <Button variant={view === "list" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={() => setView("list")}><List size={13} /></Button>
              <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={() => setView("grid")}><LayoutGrid size={13} /></Button>
            </div>
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
        ) : view === "list" ? (
          /* Dense workboard table — default view */
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-[10px] text-muted-foreground uppercase tracking-wider border-b bg-surface-2/50">
                  <th className="px-4 py-2 font-medium">Job</th>
                  <th className="px-4 py-2 font-medium hidden sm:table-cell">Type</th>
                  <th className="px-4 py-2 font-medium hidden md:table-cell">Acres</th>
                  <th className="px-4 py-2 font-medium hidden md:table-cell">Deadline</th>
                  <th className="px-4 py-2 font-medium text-right">Est. Total</th>
                  <th className="px-4 py-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(job => {
                  const jf = (job as any).job_fields?.[0];
                  const fieldName = jf?.fields?.name || "—";
                  return (
                    <tr key={job.id} className="hover:bg-surface-2 transition-colors cursor-pointer group" onClick={() => navigate(`/jobs/${job.id}`)}>
                      <td className="px-4 py-2.5">
                        <p className="font-medium truncate max-w-[180px] group-hover:text-primary transition-colors">{job.title}</p>
                        <p className="text-[10px] text-muted-foreground">{fieldName}</p>
                      </td>
                      <td className="px-4 py-2.5 hidden sm:table-cell text-muted-foreground">{formatOperationType(job.operation_type)}</td>
                      <td className="px-4 py-2.5 hidden md:table-cell tabular text-muted-foreground">{formatAcres(Number(job.total_acres))}</td>
                      <td className="px-4 py-2.5 hidden md:table-cell text-muted-foreground">{formatDateShort(job.deadline)}</td>
                      <td className="px-4 py-2.5 text-right tabular font-medium">{formatCurrency(Number(job.estimated_total))}</td>
                      <td className="px-4 py-2.5 text-right"><StatusBadge status={job.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid view — compact cards */
          <div className="grid md:grid-cols-2 gap-3">
            {filtered.map(job => {
              const jf = (job as any).job_fields?.[0];
              const fieldName = jf?.fields?.name || "—";
              const crop = jf?.fields?.crop || "other";

              return (
                <Link key={job.id} to={`/jobs/${job.id}`} className="rounded-lg border bg-card p-4 hover:shadow-card-hover transition-[box-shadow] duration-300 group">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="inline-block text-[10px] font-medium text-primary bg-primary/8 rounded px-1.5 py-0.5 mb-1.5">
                        {formatOperationType(job.operation_type)}
                      </span>
                      <h3 className="font-semibold text-[13px] group-hover:text-primary transition-colors">{job.title}</h3>
                      <p className="text-[12px] text-muted-foreground">{fieldName}</p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
                    <span className="flex items-center gap-1"><MapPin size={10} />{formatAcres(Number(job.total_acres))}</span>
                    <span className="flex items-center gap-1"><Clock size={10} />by {formatDateShort(job.deadline)}</span>
                    <span className="flex items-center gap-1"><DollarSign size={10} />{formatCurrency(Number(job.base_rate))}/{formatPricingModel(job.pricing_model).toLowerCase().replace("per ", "")}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] tabular font-medium">{formatCropType(crop)}</span>
                      {job.split_payment && <span className="text-[9px] text-info font-medium bg-info/8 px-1 py-0.5 rounded">Split</span>}
                    </div>
                    <span className="text-[12px] font-semibold tabular">{formatCurrency(Number(job.estimated_total))}</span>
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
