import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/PageSkeleton";
import { useLaborJobs } from "@/hooks/useLaborJobs";
import { LaborJobDetailPane } from "./LaborJobDetailPane";
import {
  Search, X, MapPin, Clock, DollarSign, Users,
  Briefcase, SlidersHorizontal, Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-Time",
  seasonal: "Seasonal",
  part_time: "Part-Time",
  task: "Task / Gig",
};

const COMP_LABELS: Record<string, string> = {
  hourly: "Hourly",
  salary: "Salary",
  per_task: "Per Task",
  daily: "Daily",
};

function formatComp(type: string, min?: number | null, max?: number | null) {
  const label = COMP_LABELS[type] || type;
  if (min && max && min !== max) return `$${min}–$${max} ${label}`;
  if (min) return `$${min} ${label}`;
  if (max) return `$${max} ${label}`;
  return label;
}

export function LaborJobList() {
  const { data: jobs = [], isLoading } = useLaborJobs();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  const filtered = useMemo(() => {
    let list = jobs;
    if (typeFilter !== "all") list = list.filter((j: any) => j.job_type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((j: any) =>
        j.title?.toLowerCase().includes(q) ||
        j.description?.toLowerCase().includes(q) ||
        j.location_city?.toLowerCase().includes(q)
      );
    }
    if (sortBy === "pay_high") list = [...list].sort((a: any, b: any) => (b.compensation_max || 0) - (a.compensation_max || 0));
    else if (sortBy === "pay_low") list = [...list].sort((a: any, b: any) => (a.compensation_min || 0) - (b.compensation_min || 0));
    return list;
  }, [jobs, typeFilter, search, sortBy]);

  const selected = useMemo(() => {
    if (selectedId) return filtered.find((j: any) => j.id === selectedId) || null;
    return filtered[0] || null;
  }, [selectedId, filtered]);

  if (isLoading) return <div className="px-3 pt-3"><ListSkeleton rows={8} /></div>;

  if (jobs.length === 0) {
    return (
      <div className="px-5 pt-10">
        <EmptyState
          icon={<Users size={24} />}
          title="No labor jobs posted yet"
          description="Check back soon for agricultural labor opportunities."
        />
      </div>
    );
  }

  return (
    <div className="flex" style={{ height: "calc(100vh - 170px)" }}>
      {/* LEFT filters */}
      {showFilters && (
        <div className="hidden lg:flex flex-col w-[190px] shrink-0 border-r bg-card/50 p-3 space-y-4 overflow-y-auto">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Job Type</p>
            <div className="space-y-1">
              {["all", "full_time", "seasonal", "part_time", "task"].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={cn("w-full text-left px-2 py-1.5 rounded text-[11px] transition-colors",
                    typeFilter === t ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}>
                  {t === "all" ? "All Types" : JOB_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1" />
          <p className="text-[10px] text-muted-foreground">{filtered.length} position{filtered.length !== 1 ? "s" : ""}</p>
        </div>
      )}

      {/* CENTER list */}
      <div className={cn("flex-1 min-w-0 overflow-y-auto", selected && "lg:border-r")}>
        {/* toolbar */}
        <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b px-3 py-2 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search positions…" className="h-8 pl-8 text-xs" />
              {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2"><X size={11} className="text-muted-foreground" /></button>}
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8 w-[130px] text-[11px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="pay_high">Pay: High→Low</SelectItem>
                <SelectItem value="pay_low">Pay: Low→High</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className="h-8 text-[11px] gap-1 hidden lg:flex"
              onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal size={11} /> {showFilters ? "Hide" : "Show"}
            </Button>
            <span className="text-[11px] text-muted-foreground tabular-nums ml-auto hidden sm:block">
              {filtered.length} position{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
          {/* mobile type pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 lg:hidden">
            {["all", "full_time", "seasonal", "part_time", "task"].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={cn("px-2.5 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors active:scale-[0.97]",
                  typeFilter === t ? "bg-primary text-primary-foreground shadow-sm" : "bg-card text-muted-foreground hover:text-foreground border"
                )}>
                {t === "all" ? "All" : JOB_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y">
          {filtered.map((job: any) => {
            const isSelected = selected?.id === job.id;
            return (
              <div key={job.id} onClick={() => setSelectedId(job.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors group",
                  isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/50 border-l-2 border-l-transparent"
                )}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded",
                      job.job_type === "full_time" ? "bg-chart-1/10 text-chart-1" :
                      job.job_type === "seasonal" ? "bg-chart-2/10 text-chart-2" :
                      job.job_type === "part_time" ? "bg-chart-3/10 text-chart-3" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {JOB_TYPE_LABELS[job.job_type] || job.job_type}
                    </span>
                    <p className="text-[12px] font-semibold truncate group-hover:text-primary transition-colors">{job.title}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                    {(job as any).farms?.name && <span className="truncate max-w-[120px]">{(job as any).farms.name}</span>}
                    {job.location_city && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><MapPin size={8} />{job.location_city}{job.location_state ? `, ${job.location_state}` : ""}</span>
                      </>
                    )}
                    {job.hours_per_day && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><Clock size={8} />{job.hours_per_day}h/day</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-bold tabular-nums">{formatComp(job.compensation_type, job.compensation_min, job.compensation_max)}</p>
                  {job.start_date && <p className="text-[9px] text-muted-foreground">Starts {new Date(job.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT detail pane */}
      {selected && (
        <div className="hidden lg:flex flex-col w-[380px] shrink-0 overflow-y-auto bg-card/30">
          <LaborJobDetailPane job={selected} />
        </div>
      )}
    </div>
  );
}
