import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/PageSkeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldMap } from "@/components/map/FieldMap";
import { PrivateCostCalculator } from "@/components/operators/PrivateCostCalculator";
import { JobEquipmentMatch } from "@/components/operators/JobEquipmentMatch";
import { JobCredentialMatch } from "@/components/operators/JobCredentialMatch";
import { OperatorDecisionStrip } from "@/components/jobs/OperatorDecisionStrip";
import {
  MapPin, Clock, DollarSign, Filter, Search, Bookmark, BookmarkCheck,
  X, ChevronRight, Sliders, Wheat, Navigation, Package, FileText,
  CheckCircle2, AlertTriangle, Target, SlidersHorizontal,
} from "lucide-react";
import { useMarketplaceJobs } from "@/hooks/useJobs";
import {
  formatCurrency, formatAcres, formatOperationType, formatCropType,
  formatDateShort, formatPricingModel, formatRelative,
} from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
import type { OperationType } from "@/types/domain";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const OP_FILTERS: (OperationType | "all")[] = [
  "all", "spraying", "planting", "harvest", "grain_hauling", "tillage",
  "hauling", "soil_sampling", "fertilizing", "mowing", "baling", "rock_picking",
];

export default function Marketplace() {
  const { activeMode } = useAuth();
  const { data: allJobs = [], isLoading } = useMarketplaceJobs();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  const toggleSave = (jobId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSavedJobs(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) { next.delete(jobId); toast("Removed from queue"); }
      else { next.add(jobId); toast.success("Saved to bid queue"); }
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
    if (showSavedOnly) jobs = jobs.filter(j => savedJobs.has(j.id));

    if (sortBy === "pay_high") jobs = [...jobs].sort((a, b) => Number(b.estimated_total) - Number(a.estimated_total));
    else if (sortBy === "pay_low") jobs = [...jobs].sort((a, b) => Number(a.estimated_total) - Number(b.estimated_total));
    else if (sortBy === "acres") jobs = [...jobs].sort((a, b) => Number(b.total_acres) - Number(a.total_acres));
    else if (sortBy === "deadline") jobs = [...jobs].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    return jobs;
  }, [allJobs, filter, searchQuery, showSavedOnly, savedJobs, sortBy]);

  const selectedJob = useMemo(() => {
    if (!selectedJobId) return null;
    return allJobs.find(j => j.id === selectedJobId) || null;
  }, [selectedJobId, allJobs]);

  // Auto-select first job
  const effectiveSelected = selectedJob || (filtered.length > 0 ? filtered[0] : null);

  const getContractLabel = (mode: string) => {
    if (mode === "open_bidding") return { text: "Bids Open", cls: "bg-info/10 text-info" };
    if (mode === "invite_only") return { text: "Invite", cls: "bg-muted text-muted-foreground" };
    return { text: "Fixed Price", cls: "bg-primary/10 text-primary" };
  };

  return (
    <AppShell title="Marketplace">
      <div className="animate-fade-in -mx-3 sm:-mx-5 -mt-2">
        {/* Toolbar */}
        <div className="sticky top-12 z-20 px-3 sm:px-5 py-2 bg-background/90 backdrop-blur-sm border-b space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search jobs, fields, crops…" className="h-8 pl-8 text-xs" />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X size={11} className="text-muted-foreground" />
                </button>
              )}
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8 w-[130px] text-[11px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="pay_high">Pay: High→Low</SelectItem>
                <SelectItem value="pay_low">Pay: Low→High</SelectItem>
                <SelectItem value="acres">Largest First</SelectItem>
                <SelectItem value="deadline">Soonest Deadline</SelectItem>
              </SelectContent>
            </Select>
            <Button variant={showSavedOnly ? "default" : "outline"} size="sm"
              className={cn("h-8 text-[11px] gap-1")} onClick={() => setShowSavedOnly(!showSavedOnly)}>
              <Bookmark size={11} /> Queue {savedJobs.size > 0 && `(${savedJobs.size})`}
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-[11px] gap-1 hidden lg:flex"
              onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal size={11} /> {showFilters ? "Hide" : "Show"} Filters
            </Button>
            <span className="text-[11px] text-muted-foreground tabular-nums ml-auto hidden sm:block">
              {filtered.length} job{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Type pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {OP_FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("px-2.5 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors active:scale-[0.97]",
                  filter === f ? "bg-primary text-primary-foreground shadow-sm" : "bg-card text-muted-foreground hover:text-foreground border"
                )}>
                {f === "all" ? "All Types" : formatOperationType(f)}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="px-3 sm:px-5 pt-3"><ListSkeleton rows={8} /></div>
        ) : filtered.length === 0 ? (
          <div className="px-3 sm:px-5 pt-6">
            <EmptyState
              icon={showSavedOnly ? <Bookmark size={24} /> : <Filter size={24} />}
              title={showSavedOnly ? "Bid queue empty" : "No jobs match"}
              description={showSavedOnly ? "Save jobs to build your bid queue." : "Adjust filters or check back later."}
              action={showSavedOnly ? { label: "Browse All", onClick: () => setShowSavedOnly(false) } : undefined}
            />
          </div>
        ) : (
          /* 3-pane workboard */
          <div className="flex" style={{ height: "calc(100vh - 170px)" }}>
            {/* LEFT — Filter sidebar (desktop) */}
            {showFilters && (
              <div className="hidden lg:flex flex-col w-[200px] shrink-0 border-r bg-card/50 p-3 space-y-4 overflow-y-auto">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Saved Views</p>
                  <div className="space-y-1">
                    {[
                      { label: "All Jobs", filter: "all" },
                      { label: "Spray Jobs", filter: "spraying" },
                      { label: "Harvest Jobs", filter: "harvest" },
                      { label: "Hauling Jobs", filter: "grain_hauling" },
                      { label: "Planting Jobs", filter: "planting" },
                    ].map(v => (
                      <button key={v.filter} onClick={() => { setFilter(v.filter); setShowSavedOnly(false); }}
                        className={cn("w-full text-left px-2 py-1.5 rounded text-[11px] transition-colors",
                          filter === v.filter && !showSavedOnly ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}>
                        {v.label}
                      </button>
                    ))}
                    <button onClick={() => setShowSavedOnly(true)}
                      className={cn("w-full text-left px-2 py-1.5 rounded text-[11px] transition-colors flex items-center gap-1.5",
                        showSavedOnly ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}>
                      <Bookmark size={10} /> My Bid Queue
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Filters</p>
                  <div className="space-y-1.5 text-[11px]">
                    <label className="flex items-center gap-2 text-muted-foreground cursor-pointer hover:text-foreground">
                      <DollarSign size={10} /> Fixed Price Only
                    </label>
                    <label className="flex items-center gap-2 text-muted-foreground cursor-pointer hover:text-foreground">
                      <AlertTriangle size={10} /> Urgent Only
                    </label>
                    <label className="flex items-center gap-2 text-muted-foreground cursor-pointer hover:text-foreground">
                      <Target size={10} /> Best Match
                    </label>
                  </div>
                </div>

                <div className="flex-1" />

                <div className="pt-3 border-t">
                  <p className="text-[10px] text-muted-foreground">
                    {allJobs.length} total · {savedJobs.size} saved
                  </p>
                </div>
              </div>
            )}

            {/* CENTER — Job list */}
            <div className={cn(
              "flex-1 min-w-0 overflow-y-auto border-r",
              !effectiveSelected && "lg:border-r-0"
            )}>
              <div className="divide-y">
                {filtered.map(job => {
                  const jf = (job as any).job_fields?.[0];
                  const fieldName = jf?.fields?.name || "—";
                  const isSaved = savedJobs.has(job.id);
                  const isSelected = effectiveSelected?.id === job.id;
                  const contractLabel = getContractLabel((job as any).contract_mode || "fixed_price");

                  return (
                    <div key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors group",
                        isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/50 border-l-2 border-l-transparent",
                      )}>
                      {/* Save toggle */}
                      <button onClick={e => toggleSave(job.id, e)} className="shrink-0 p-0.5 hover:text-primary">
                        {isSaved ? <BookmarkCheck size={14} className="text-primary" /> : <Bookmark size={14} className="text-muted-foreground/40 group-hover:text-muted-foreground" />}
                      </button>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded", contractLabel.cls)}>
                            {contractLabel.text}
                          </span>
                          <p className="text-[12px] font-semibold truncate group-hover:text-primary transition-colors">
                            {job.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-0.5"><MapPin size={8} />{fieldName}</span>
                          <span>·</span>
                          <span>{formatAcres(Number(job.total_acres))}</span>
                          <span>·</span>
                          <span>by {formatDateShort(job.deadline)}</span>
                          {job.urgency !== "normal" && (
                            <>
                              <span>·</span>
                              <span className="text-destructive font-bold uppercase">{job.urgency}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right — payout */}
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-bold tabular-nums">{formatCurrency(Number(job.estimated_total))}</p>
                        <p className="text-[9px] text-muted-foreground">{formatPricingModel(job.pricing_model)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT — Detail pane (desktop) */}
            {effectiveSelected && (
              <div className="hidden lg:flex flex-col w-[380px] shrink-0 overflow-y-auto bg-card/30">
                <JobDetailPane
                  job={effectiveSelected}
                  isSaved={savedJobs.has(effectiveSelected.id)}
                  onToggleSave={() => toggleSave(effectiveSelected.id)}
                  onOpenFull={() => navigate(`/jobs/${effectiveSelected.id}`)}
                />
              </div>
            )}
          </div>
        )}

        {/* Mobile: selected job overlay */}
        {effectiveSelected && (
          <div className="lg:hidden fixed bottom-14 left-0 right-0 z-30 bg-card/95 backdrop-blur-sm border-t p-2.5 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold truncate">{effectiveSelected.title}</p>
              <p className="text-[10px] text-muted-foreground">
                {formatAcres(Number(effectiveSelected.total_acres))} · {formatCurrency(Number(effectiveSelected.estimated_total))}
              </p>
            </div>
            <Button size="sm" className="h-8 text-xs" onClick={() => navigate(`/jobs/${effectiveSelected.id}`)}>
              View <ChevronRight size={12} />
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

/* Detail pane for the right side of the workboard */
function JobDetailPane({ job, isSaved, onToggleSave, onOpenFull }: {
  job: any; isSaved: boolean; onToggleSave: () => void; onOpenFull: () => void;
}) {
  const jf = (job as any).job_fields?.[0];
  const fieldData = jf?.fields;
  const contractMode = (job as any).contract_mode || "fixed_price";

  const mapField = fieldData?.centroid_lat ? {
    id: jf.field_id, name: fieldData.name,
    acreage: Number(fieldData.acreage), status: "active",
    centroid_lat: Number(fieldData.centroid_lat),
    centroid_lng: Number(fieldData.centroid_lng),
    bbox_north: fieldData.bbox_north ? Number(fieldData.bbox_north) : null,
    bbox_south: fieldData.bbox_south ? Number(fieldData.bbox_south) : null,
    bbox_east: fieldData.bbox_east ? Number(fieldData.bbox_east) : null,
    bbox_west: fieldData.bbox_west ? Number(fieldData.bbox_west) : null,
    boundary_geojson: fieldData.boundary_geojson || null,
  } : null;

  return (
    <div className="flex flex-col h-full">
      {/* Map */}
      {mapField ? (
        <div className="h-[180px] shrink-0">
          <FieldMap field={mapField} aspectRatio="auto" />
        </div>
      ) : (
        <div className="h-[100px] shrink-0 bg-muted/30 flex items-center justify-center">
          <MapPin size={18} className="text-muted-foreground/30" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={job.status} />
            {job.urgency !== "normal" && (
              <span className="text-[9px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full uppercase">{job.urgency}</span>
            )}
          </div>
          <h2 className="text-[15px] font-bold leading-tight">{job.title}</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {formatOperationType(job.operation_type)} · {fieldData?.name || "No field"}
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Acreage", value: formatAcres(Number(job.total_acres)), icon: Wheat },
            { label: "Payout", value: formatCurrency(Number(job.estimated_total)), icon: DollarSign },
            { label: "Deadline", value: formatDateShort(job.deadline), icon: Clock },
            { label: "Pricing", value: formatPricingModel(job.pricing_model), icon: DollarSign },
          ].map(k => (
            <div key={k.label} className="rounded-md bg-muted/40 p-2">
              <p className="text-[9px] text-muted-foreground flex items-center gap-1"><k.icon size={9} />{k.label}</p>
              <p className="text-[12px] font-semibold tabular-nums mt-0.5">{k.value}</p>
            </div>
          ))}
        </div>

        {/* Distance */}
        {job.travel_distance && (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 rounded-md px-2.5 py-1.5">
            <Navigation size={11} className="text-primary" />
            <span>{Number(job.travel_distance).toFixed(0)} mi from your base</span>
            {job.travel_eta && <span>· ~{job.travel_eta} min</span>}
          </div>
        )}

        {/* Crop */}
        {fieldData?.crop && (
          <div className="flex items-center gap-2 text-[11px]">
            <Wheat size={11} className="text-muted-foreground" />
            <span className="text-muted-foreground">Crop:</span>
            <span className="font-medium">{formatCropType(fieldData.crop)}</span>
          </div>
        )}

        {/* Equipment + Credential match */}
        <div className="space-y-2">
          <JobEquipmentMatch operationType={job.operation_type} compact />
          <JobCredentialMatch operationType={job.operation_type} />
        </div>

        {/* Private costing */}
        <PrivateCostCalculator job={job} compact />

        {/* Description */}
        {job.description && (
          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Description</p>
            <p className="text-[12px] text-muted-foreground leading-relaxed">{job.description}</p>
          </div>
        )}

        {/* Notes */}
        {job.requirements && (
          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Requirements</p>
            <p className="text-[12px] text-muted-foreground">{job.requirements}</p>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="shrink-0 border-t bg-card p-3 space-y-2">
        <div className="flex gap-2">
          {contractMode === "fixed_price" ? (
            <Button className="flex-1 h-9 text-xs gap-1" onClick={onOpenFull}>
              <CheckCircle2 size={12} /> Accept · {formatCurrency(Number(job.base_rate))}/{formatPricingModel(job.pricing_model).split(" ")[1]?.toLowerCase() || "ac"}
            </Button>
          ) : (
            <Button className="flex-1 h-9 text-xs gap-1" onClick={onOpenFull}>
              <FileText size={12} /> Submit Quote
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-9 gap-1 text-xs" onClick={onToggleSave}>
            {isSaved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
            {isSaved ? "Saved" : "Save"}
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="w-full h-7 text-[11px] text-muted-foreground"
          onClick={onOpenFull}>
          Open Full Details →
        </Button>
      </div>
    </div>
  );
}
