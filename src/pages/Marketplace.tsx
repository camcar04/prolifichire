import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/PageSkeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MapPin, Clock, DollarSign, ArrowRight, Filter, LayoutGrid, List,
  Bookmark, BookmarkCheck, Search, Sliders, Truck, ChevronRight, X, AlertTriangle,
} from "lucide-react";
import { useMarketplaceJobs } from "@/hooks/useJobs";
import { formatCurrency, formatAcres, formatOperationType, formatCropType, formatDateShort, formatPricingModel } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
import type { OperationType } from "@/types/domain";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const operationFilters: (OperationType | "all")[] = ["all", "spraying", "planting", "harvest", "grain_hauling", "tillage", "hauling", "soil_sampling", "fertilizing", "mowing", "baling", "rock_picking"];

export default function Marketplace() {
  const { activeMode } = useAuth();
  const { data: allJobs = [], isLoading } = useMarketplaceJobs();
  const [filter, setFilter] = useState<string>("all");
  const [view, setView] = useState<"list" | "grid">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>("newest");
  const navigate = useNavigate();

  const toggleSave = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedJobs(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
        toast("Removed from bid queue");
      } else {
        next.add(jobId);
        toast.success("Saved to bid queue");
      }
      return next;
    });
  };

  const filtered = useMemo(() => {
    let jobs = filter === "all" ? allJobs : allJobs.filter(j => j.operation_type === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.operation_type.toLowerCase().includes(q) ||
        (j as any).job_fields?.[0]?.fields?.name?.toLowerCase().includes(q)
      );
    }
    if (showSavedOnly) {
      jobs = jobs.filter(j => savedJobs.has(j.id));
    }
    // Sort
    if (sortBy === "pay_high") jobs = [...jobs].sort((a, b) => Number(b.estimated_total) - Number(a.estimated_total));
    else if (sortBy === "pay_low") jobs = [...jobs].sort((a, b) => Number(a.estimated_total) - Number(b.estimated_total));
    else if (sortBy === "acres") jobs = [...jobs].sort((a, b) => Number(b.total_acres) - Number(a.total_acres));
    else if (sortBy === "deadline") jobs = [...jobs].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    return jobs;
  }, [allJobs, filter, searchQuery, showSavedOnly, savedJobs, sortBy]);

  return (
    <AppShell title={showSavedOnly ? "Bid Queue" : "Marketplace"}>
      <div className="animate-fade-in max-w-5xl">
        {/* Toolbar */}
        <div className="sticky top-12 z-20 -mx-3 sm:-mx-5 px-3 sm:px-5 py-2 bg-background/80 backdrop-blur-sm border-b mb-3 space-y-2">
          {/* Row 1: search + sort + view */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search jobs…" className="h-7 pl-7 text-xs"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X size={11} className="text-muted-foreground" />
                </button>
              )}
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-7 w-[120px] text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="pay_high">Pay: High→Low</SelectItem>
                <SelectItem value="pay_low">Pay: Low→High</SelectItem>
                <SelectItem value="acres">Largest</SelectItem>
                <SelectItem value="deadline">Soonest</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 ml-auto shrink-0">
              <Button
                variant={showSavedOnly ? "default" : "outline"} size="sm"
                className={cn("h-7 text-[10px] gap-1", showSavedOnly && "bg-primary")}
                onClick={() => setShowSavedOnly(!showSavedOnly)}
              >
                <Bookmark size={10} />
                Bid Queue {savedJobs.size > 0 && `(${savedJobs.size})`}
              </Button>
              <Button variant={view === "list" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={() => setView("list")}><List size={13} /></Button>
              <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={() => setView("grid")}><LayoutGrid size={13} /></Button>
            </div>
          </div>

          {/* Row 2: type filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {operationFilters.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("px-2.5 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-colors active:scale-[0.97]",
                  filter === f ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground border"
                )}>
                {f === "all" ? "All Types" : formatOperationType(f)}
              </button>
            ))}
            <span className="text-[10px] text-muted-foreground tabular-nums ml-auto shrink-0">{filtered.length} jobs</span>
          </div>
        </div>

        {isLoading ? (
          <ListSkeleton rows={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={showSavedOnly ? <Bookmark size={24} /> : <Filter size={24} />}
            title={showSavedOnly ? "Bid queue is empty" : filter === "all" ? "No jobs available" : "No jobs match this filter"}
            description={showSavedOnly
              ? "Save jobs from the marketplace to build your bid queue."
              : "Try a different filter or check back later."}
            action={showSavedOnly ? { label: "Browse Marketplace", onClick: () => setShowSavedOnly(false) } : undefined}
          />
        ) : view === "list" ? (
          /* Dense workboard table */
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-[10px] text-muted-foreground uppercase tracking-wider border-b bg-muted/30">
                  <th className="px-3 py-2 font-medium w-6"></th>
                  <th className="px-3 py-2 font-medium">Job</th>
                  <th className="px-3 py-2 font-medium hidden sm:table-cell">Type</th>
                  <th className="px-3 py-2 font-medium hidden md:table-cell text-right">Acres</th>
                  <th className="px-3 py-2 font-medium hidden md:table-cell">Deadline</th>
                  <th className="px-3 py-2 font-medium text-right">Payout</th>
                  <th className="px-3 py-2 font-medium hidden lg:table-cell">Mode</th>
                  <th className="px-3 py-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(job => {
                  const jf = (job as any).job_fields?.[0];
                  const fieldName = jf?.fields?.name || "—";
                  const isSaved = savedJobs.has(job.id);
                  return (
                    <tr key={job.id} className={cn(
                      "hover:bg-surface-2 transition-colors cursor-pointer group",
                      isSaved && "bg-primary/3"
                    )} onClick={() => navigate(`/jobs/${job.id}`)}>
                      <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                        <button onClick={e => toggleSave(job.id, e)} className="p-0.5 hover:text-primary transition-colors">
                          {isSaved ? <BookmarkCheck size={13} className="text-primary" /> : <Bookmark size={13} className="text-muted-foreground" />}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium truncate max-w-[200px] group-hover:text-primary transition-colors">{job.title}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin size={8} />{fieldName}
                        </p>
                      </td>
                      <td className="px-3 py-2 hidden sm:table-cell text-muted-foreground">{formatOperationType(job.operation_type)}</td>
                      <td className="px-3 py-2 hidden md:table-cell tabular-nums text-muted-foreground text-right">{formatAcres(Number(job.total_acres))}</td>
                      <td className="px-3 py-2 hidden md:table-cell text-muted-foreground">{formatDateShort(job.deadline)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold">{formatCurrency(Number(job.estimated_total))}</td>
                      <td className="px-3 py-2 hidden lg:table-cell text-muted-foreground text-[10px]">
                        {(job as any).contract_mode === "open_bidding" ? "Bidding" : (job as any).contract_mode === "invite_only" ? "Invite" : "Fixed"}
                      </td>
                      <td className="px-3 py-2 text-right"><StatusBadge status={job.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid view */
          <div className="grid md:grid-cols-2 gap-3">
            {filtered.map(job => {
              const jf = (job as any).job_fields?.[0];
              const fieldName = jf?.fields?.name || "—";
              const crop = jf?.fields?.crop || "other";
              const isSaved = savedJobs.has(job.id);

              return (
                <div key={job.id} className={cn(
                  "rounded-lg border bg-card p-3 hover:shadow-card-hover transition-[box-shadow] duration-300 group relative",
                  isSaved && "border-primary/30"
                )}>
                  <button onClick={e => toggleSave(job.id, e)} className="absolute top-3 right-3 p-1 hover:bg-surface-2 rounded transition-colors">
                    {isSaved ? <BookmarkCheck size={14} className="text-primary" /> : <Bookmark size={14} className="text-muted-foreground" />}
                  </button>
                  <Link to={`/jobs/${job.id}`}>
                    <span className="inline-block text-[9px] font-medium text-primary bg-primary/8 rounded px-1.5 py-0.5 mb-1.5 uppercase tracking-wide">
                      {formatOperationType(job.operation_type)}
                    </span>
                    <h3 className="font-semibold text-[13px] group-hover:text-primary transition-colors pr-6">{job.title}</h3>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin size={9} />{fieldName}</p>

                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-2">
                      <span>{formatAcres(Number(job.total_acres))}</span>
                      <span>by {formatDateShort(job.deadline)}</span>
                      <span>{formatCurrency(Number(job.base_rate))}/{formatPricingModel(job.pricing_model).toLowerCase().replace("per ", "")}</span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] tabular-nums">{formatCropType(crop)}</span>
                        {(job as any).contract_mode === "open_bidding" && <span className="text-[8px] font-bold text-info bg-info/8 px-1 py-0.5 rounded uppercase">Bid</span>}
                        {job.split_payment && <span className="text-[8px] text-info font-medium bg-info/8 px-1 py-0.5 rounded">Split</span>}
                      </div>
                      <span className="text-[13px] font-bold tabular-nums">{formatCurrency(Number(job.estimated_total))}</span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
