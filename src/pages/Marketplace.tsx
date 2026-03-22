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
import { VerifiedJobBadge, deriveJobBadges } from "@/components/trust/VerifiedJobBadge";
import { PosterStatsCard } from "@/components/trust/PosterStatsCard";
import { ReportJobDialog } from "@/components/trust/ReportJobDialog";
import { validateJobQuality } from "@/hooks/useTrustSystem";
import {
  MapPin, Clock, DollarSign, Search, Bookmark, BookmarkCheck,
  X, ChevronRight, Wheat, Navigation, FileText,
  CheckCircle2, AlertTriangle, Target, SlidersHorizontal, ArrowUpDown,
  Layers, Truck, Sprout, Tractor, Package,
} from "lucide-react";
import { useMarketplaceJobs } from "@/hooks/useJobs";
import { useSavedJobIds, useToggleSaveJob } from "@/hooks/useSavedJobs";
import {
  formatCurrency, formatAcres, formatOperationType, formatCropType,
  formatDateShort, formatPricingModel, formatRelative,
} from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
import type { OperationType } from "@/types/domain";
import { cn } from "@/lib/utils";

const OP_FILTERS: { value: OperationType | "all"; label: string; icon: any }[] = [
  { value: "all", label: "All", icon: Layers },
  { value: "spraying", label: "Spray", icon: Sprout },
  { value: "planting", label: "Plant", icon: Sprout },
  { value: "harvest", label: "Harvest", icon: Wheat },
  { value: "grain_hauling", label: "Haul", icon: Truck },
  { value: "tillage", label: "Tillage", icon: Tractor },
  { value: "fertilizing", label: "Fertilize", icon: Package },
  { value: "rock_picking", label: "Rock Pick", icon: Tractor },
];

export default function Marketplace() {
  const { activeMode } = useAuth();
  const { data: allJobs = [], isLoading } = useMarketplaceJobs();
  const savedJobIds = useSavedJobIds();
  const toggleSaveMutation = useToggleSaveJob();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  const toggleSave = (jobId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    toggleSaveMutation.mutate({ jobId, isSaved: savedJobIds.has(jobId) });
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
    if (showSavedOnly) jobs = jobs.filter(j => savedJobIds.has(j.id));

    if (sortBy === "pay_high") jobs = [...jobs].sort((a, b) => Number(b.estimated_total) - Number(a.estimated_total));
    else if (sortBy === "pay_low") jobs = [...jobs].sort((a, b) => Number(a.estimated_total) - Number(b.estimated_total));
    else if (sortBy === "acres") jobs = [...jobs].sort((a, b) => Number(b.total_acres) - Number(a.total_acres));
    else if (sortBy === "deadline") jobs = [...jobs].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    return jobs;
  }, [allJobs, filter, searchQuery, showSavedOnly, savedJobIds, sortBy]);

  const selectedJob = useMemo(() => {
    if (!selectedJobId) return null;
    return allJobs.find(j => j.id === selectedJobId) || null;
  }, [selectedJobId, allJobs]);

  const effectiveSelected = selectedJob || (filtered.length > 0 ? filtered[0] : null);

  const getContractTag = (mode: string) => {
    if (mode === "open_bidding") return { text: "BID", cls: "bg-blue-600/90 text-white" };
    if (mode === "invite_only") return { text: "INV", cls: "bg-muted text-muted-foreground" };
    return { text: "FIX", cls: "bg-primary/90 text-primary-foreground" };
  };

  const getOpIcon = (type: string) => {
    if (type.includes("spray") || type.includes("fertil")) return Sprout;
    if (type.includes("harvest")) return Wheat;
    if (type.includes("haul")) return Truck;
    if (type.includes("plant")) return Sprout;
    return Tractor;
  };

  return (
    <AppShell title="Marketplace">
      <div className="animate-fade-in -mx-3 sm:-mx-5 -mt-2">
        {/* Command bar */}
        <div className="sticky top-12 z-20 bg-background border-b">
          {/* Row 1: search + controls */}
          <div className="flex items-center gap-1.5 px-2 sm:px-4 h-10">
            <div className="relative flex-1 max-w-xs">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search…" className="h-7 pl-7 text-[11px] bg-surface-2 border-0 focus-visible:ring-1" />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X size={10} className="text-muted-foreground" />
                </button>
              )}
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-7 w-[110px] text-[10px] border-0 bg-surface-2">
                <ArrowUpDown size={9} className="mr-1" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="pay_high">Pay ↓</SelectItem>
                <SelectItem value="pay_low">Pay ↑</SelectItem>
                <SelectItem value="acres">Acres ↓</SelectItem>
                <SelectItem value="deadline">Deadline ↑</SelectItem>
              </SelectContent>
            </Select>
            <Button variant={showSavedOnly ? "default" : "ghost"} size="sm"
              className="h-7 text-[10px] gap-1 px-2" onClick={() => setShowSavedOnly(!showSavedOnly)}>
              <Bookmark size={10} />
              <span className="hidden sm:inline">Queue</span>
              {savedJobIds.size > 0 && <span className="tabular-nums">({savedJobIds.size})</span>}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 px-2 hidden lg:flex"
              onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal size={10} />
            </Button>
            <span className="text-[10px] text-muted-foreground tabular-nums ml-auto font-medium">
              {filtered.length}
            </span>
          </div>

          {/* Row 2: type chips */}
          <div className="flex items-center gap-1 px-2 sm:px-4 pb-1.5 overflow-x-auto no-scrollbar">
            {OP_FILTERS.map(f => {
              const active = filter === f.value && !showSavedOnly;
              return (
                <button key={f.value} onClick={() => { setFilter(f.value); setShowSavedOnly(false); }}
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap transition-all active:scale-[0.96]",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
                  )}>
                  <f.icon size={9} />
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="px-3 sm:px-5 pt-3"><ListSkeleton rows={8} /></div>
        ) : filtered.length === 0 ? (
          <div className="px-3 sm:px-5 pt-8">
            <EmptyState
              icon={showSavedOnly ? <Bookmark size={20} /> : <Target size={20} />}
              title={showSavedOnly ? "Bid queue empty" : "No jobs match"}
              description={showSavedOnly
                ? "Save jobs from the marketplace to build your queue."
                : "Try expanding your radius or adjusting filters."}
              action={showSavedOnly ? { label: "Browse All", onClick: () => setShowSavedOnly(false) } : undefined}
            />
          </div>
        ) : (
          <div className="flex" style={{ height: "calc(100vh - 150px)" }}>
            {/* LEFT — Sidebar */}
            {showFilters && (
              <aside className="hidden lg:flex flex-col w-[180px] shrink-0 border-r p-2 space-y-3 overflow-y-auto bg-surface-1">
                <div>
                  <p className="section-header px-1 mb-1.5">Views</p>
                  <nav className="space-y-px">
                    {[
                      { label: "All Jobs", val: "all" },
                      { label: "Spray", val: "spraying" },
                      { label: "Harvest", val: "harvest" },
                      { label: "Hauling", val: "grain_hauling" },
                      { label: "Planting", val: "planting" },
                    ].map(v => (
                      <button key={v.val} onClick={() => { setFilter(v.val); setShowSavedOnly(false); }}
                        className={cn("w-full text-left px-2 py-1 rounded text-[11px] transition-colors",
                          filter === v.val && !showSavedOnly
                            ? "bg-primary/8 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
                        )}>
                        {v.label}
                      </button>
                    ))}
                    <button onClick={() => setShowSavedOnly(true)}
                      className={cn("w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-1.5",
                        showSavedOnly
                          ? "bg-primary/8 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
                      )}>
                      <Bookmark size={9} /> Bid Queue
                    </button>
                  </nav>
                </div>

                <div>
                  <p className="section-header px-1 mb-1.5">Quick Filters</p>
                  <div className="space-y-0.5 text-[11px] px-1">
                    <label className="flex items-center gap-1.5 text-muted-foreground cursor-pointer hover:text-foreground py-0.5">
                      <DollarSign size={9} /> Fixed Price
                    </label>
                    <label className="flex items-center gap-1.5 text-muted-foreground cursor-pointer hover:text-foreground py-0.5">
                      <AlertTriangle size={9} /> Urgent
                    </label>
                    <label className="flex items-center gap-1.5 text-muted-foreground cursor-pointer hover:text-foreground py-0.5">
                      <Target size={9} /> Best Match
                    </label>
                  </div>
                </div>

                <div className="flex-1" />
                <p className="text-[9px] text-muted-foreground px-1 pb-1">
                  {allJobs.length} total · {savedJobIds.size} saved
                </p>
              </aside>
            )}

            {/* CENTER — Job rows */}
            <div className={cn(
              "flex-1 min-w-0 overflow-y-auto",
              effectiveSelected && "lg:border-r"
            )}>
              {/* Table header (desktop) */}
              <div className="hidden sm:grid grid-cols-[1fr_80px_70px_80px] items-center px-3 h-7 border-b bg-surface-2/60 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Job</span>
                <span className="text-right">Pay</span>
                <span className="text-right">Acres</span>
                <span className="text-right">Deadline</span>
              </div>

              <div className="divide-y divide-border/60">
                {filtered.map(job => {
                  const jf = (job as any).job_fields?.[0];
                  const fieldData = jf?.fields;
                  const fieldName = fieldData?.name || "—";
                  const loc = fieldData?.county && fieldData?.state
                    ? `${fieldData.county}, ${fieldData.state}`
                    : fieldData?.state || "";
                  const isSaved = savedJobIds.has(job.id);
                  const isSelected = effectiveSelected?.id === job.id;
                  const tag = getContractTag((job as any).contract_mode || "fixed_price");
                  const OpIcon = getOpIcon(job.operation_type);

                  return (
                    <div key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className={cn(
                        "grid grid-cols-[1fr_80px_70px_80px] sm:grid items-center px-3 py-2 cursor-pointer transition-[background-color] duration-100 group",
                        "flex flex-col sm:grid",
                        isSelected
                          ? "bg-primary/4 border-l-2 border-l-primary"
                          : "hover:bg-surface-2/70 border-l-2 border-l-transparent",
                      )}>
                      {/* Job info */}
                      <div className="flex items-center gap-2 min-w-0 col-span-1 sm:col-span-1">
                        <button onClick={e => toggleSave(job.id, e)}
                          className="shrink-0 p-0.5 hover:text-primary transition-colors">
                          {isSaved
                            ? <BookmarkCheck size={12} className="text-primary" />
                            : <Bookmark size={12} className="text-muted-foreground/30 group-hover:text-muted-foreground" />}
                        </button>

                        <div className="shrink-0 w-6 h-6 rounded bg-surface-3 flex items-center justify-center">
                          <OpIcon size={11} className="text-muted-foreground" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className={cn("text-[8px] font-bold px-1 py-px rounded leading-none", tag.cls)}>
                              {tag.text}
                            </span>
                            <p className="text-[12px] font-semibold truncate leading-tight group-hover:text-primary transition-colors">
                              {fieldName}
                            </p>
                            {job.urgency !== "normal" && (
                              <span className="text-[8px] font-bold text-destructive bg-destructive/10 px-1 py-px rounded uppercase leading-none">
                                {job.urgency}
                              </span>
                            )}
                            {(() => {
                              const quality = validateJobQuality(job);
                              const badges = deriveJobBadges({ ...job, _confirmed: true }, null);
                              return badges.slice(0, 2).map(b => (
                                <VerifiedJobBadge key={b} type={b} size="sm" />
                              ));
                            })()}
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-none mt-0.5 truncate">
                            {formatOperationType(job.operation_type)}
                            {loc && ` · ${loc}`}
                            {job.travel_distance && ` · ${Number(job.travel_distance).toFixed(0)} mi`}
                          </p>
                        </div>
                      </div>

                      {/* Pay */}
                      <div className="text-right hidden sm:block">
                        <p className="text-[12px] font-bold tabular-nums leading-none">
                          {formatCurrency(Number(job.estimated_total))}
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">
                          {formatPricingModel(job.pricing_model)}
                        </p>
                      </div>

                      {/* Acres */}
                      <p className="text-[11px] tabular-nums text-right hidden sm:block text-muted-foreground">
                        {formatAcres(Number(job.total_acres))}
                      </p>

                      {/* Deadline */}
                      <p className="text-[10px] text-right hidden sm:block text-muted-foreground tabular-nums">
                        {formatDateShort(job.deadline)}
                      </p>

                      {/* Mobile: secondary row */}
                      <div className="flex items-center justify-between mt-1 sm:hidden col-span-full">
                        <span className="text-[11px] tabular-nums text-muted-foreground">
                          {formatAcres(Number(job.total_acres))} · {formatDateShort(job.deadline)}
                        </span>
                        <span className="text-[12px] font-bold tabular-nums">
                          {formatCurrency(Number(job.estimated_total))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT — Detail pane */}
            {effectiveSelected && (
              <div className="hidden lg:flex flex-col w-[360px] shrink-0 overflow-y-auto">
                <JobDetailPane
                  job={effectiveSelected}
                  isSaved={savedJobIds.has(effectiveSelected.id)}
                  onToggleSave={() => toggleSave(effectiveSelected.id)}
                  onOpenFull={() => navigate(`/jobs/${effectiveSelected.id}`)}
                />
              </div>
            )}
          </div>
        )}

        {/* Mobile: selected job bottom bar */}
        {effectiveSelected && (
          <div className="lg:hidden fixed bottom-14 left-0 right-0 z-30 bg-card border-t px-3 py-2 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold truncate">{effectiveSelected.title}</p>
              <p className="text-[10px] text-muted-foreground tabular-nums">
                {formatAcres(Number(effectiveSelected.total_acres))} · {formatCurrency(Number(effectiveSelected.estimated_total))}
              </p>
            </div>
            <Button size="sm" className="h-7 text-[10px] gap-1" onClick={() => navigate(`/jobs/${effectiveSelected.id}`)}>
              View <ChevronRight size={10} />
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

/* ──────────────────── Detail Pane ──────────────────── */

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
        <div className="h-[160px] shrink-0 border-b">
          <FieldMap field={mapField} aspectRatio="auto" />
        </div>
      ) : (
        <div className="h-[80px] shrink-0 bg-surface-2 flex items-center justify-center border-b">
          <MapPin size={16} className="text-muted-foreground/20" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Header */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <StatusBadge status={job.status} />
            {job.urgency !== "normal" && (
              <span className="text-[8px] font-bold text-destructive bg-destructive/10 px-1 py-px rounded uppercase">
                {job.urgency}
              </span>
            )}
            {(() => {
              const badges = deriveJobBadges({ ...job, _confirmed: true }, null);
              return badges.map(b => <VerifiedJobBadge key={b} type={b} size="md" />);
            })()}
          </div>
          <h2 className="text-sm font-bold leading-tight">{job.title}</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {formatOperationType(job.operation_type)} · {fieldData?.name || "No field"}
          </p>
        </div>

        {/* Metrics strip */}
        <div className="flex items-stretch divide-x border rounded bg-surface-1">
          {[
            { label: "Pay", value: formatCurrency(Number(job.estimated_total)) },
            { label: "Acres", value: formatAcres(Number(job.total_acres)) },
            { label: "Rate", value: `${formatCurrency(Number(job.base_rate))}/${formatPricingModel(job.pricing_model).split(" ")[1]?.toLowerCase() || "ac"}` },
            { label: "Due", value: formatDateShort(job.deadline) },
          ].map(k => (
            <div key={k.label} className="flex-1 px-2 py-1.5 text-center">
              <p className="text-[8px] text-muted-foreground font-medium uppercase tracking-wider">{k.label}</p>
              <p className="text-[11px] font-bold tabular-nums mt-px">{k.value}</p>
            </div>
          ))}
        </div>

        {/* Distance */}
        {job.travel_distance && (
          <div className="flex items-center gap-1.5 text-[10px] bg-surface-2 rounded px-2 py-1">
            <Navigation size={10} className="text-primary" />
            <span className="text-muted-foreground">{Number(job.travel_distance).toFixed(0)} mi from base</span>
            {job.travel_eta && <span className="text-muted-foreground">· ~{job.travel_eta} min</span>}
          </div>
        )}

        {/* Crop */}
        {fieldData?.crop && fieldData.crop !== "other" && (
          <div className="flex items-center gap-1.5 text-[10px]">
            <Wheat size={10} className="text-muted-foreground" />
            <span className="text-muted-foreground">Crop:</span>
            <span className="font-medium">{formatCropType(fieldData.crop)}</span>
          </div>
        )}

        {/* Equipment + Credential match */}
        <div className="space-y-1.5">
          <JobEquipmentMatch operationType={job.operation_type} compact />
          <JobCredentialMatch operationType={job.operation_type} />
        </div>

        {/* Private costing */}
        <PrivateCostCalculator job={job} compact />

        {/* Description */}
        {job.description && (
          <div className="flat-panel">
            <p className="section-header mb-1">Description</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{job.description}</p>
          </div>
        )}

        {/* Requirements */}
        {job.requirements && (
          <div className="flat-panel">
            <p className="section-header mb-1">Requirements</p>
            <p className="text-[11px] text-muted-foreground">{job.requirements}</p>
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      <div className="shrink-0 border-t p-2.5 space-y-1.5 bg-surface-1">
        <div className="flex gap-1.5">
          {contractMode === "fixed_price" ? (
            <Button className="flex-1 h-8 text-[11px] gap-1" onClick={onOpenFull}>
              <CheckCircle2 size={11} /> Accept · {formatCurrency(Number(job.base_rate))}/{formatPricingModel(job.pricing_model).split(" ")[1]?.toLowerCase() || "ac"}
            </Button>
          ) : (
            <Button className="flex-1 h-8 text-[11px] gap-1" onClick={onOpenFull}>
              <FileText size={11} /> Submit Quote
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-8 gap-1 text-[10px] px-2" onClick={onToggleSave}>
            {isSaved ? <BookmarkCheck size={11} /> : <Bookmark size={11} />}
            {isSaved ? "Saved" : "Save"}
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="w-full h-6 text-[10px] text-muted-foreground"
          onClick={onOpenFull}>
          Full Details →
        </Button>
      </div>
    </div>
  );
}
