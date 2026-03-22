import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/PageSkeleton";
import { CreateFarmDialog } from "@/components/fields/CreateFarmDialog";
import { CreateFieldDialog } from "@/components/fields/CreateFieldDialog";
import { Map, Plus, ArrowRight, Search, Building2, Wheat, ChevronDown, ChevronRight as ChevronR } from "lucide-react";
import { useFields, useFarms } from "@/hooks/useFields";
import { formatAcres, formatCropType } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function FieldsPage() {
  const { data: fields = [], isLoading: fieldsLoading } = useFields();
  const { data: farms = [], isLoading: farmsLoading } = useFarms();
  const [search, setSearch] = useState("");
  const [cropFilter, setCropFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [collapsedFarms, setCollapsedFarms] = useState<Set<string>>(new Set());
  const [showCreateFarm, setShowCreateFarm] = useState(false);
  const [showCreateField, setShowCreateField] = useState(false);

  const isLoading = fieldsLoading || farmsLoading;

  const filteredFields = useMemo(() => {
    return fields.filter(f => {
      if (search) {
        const q = search.toLowerCase();
        const farmName = (f as any).farms?.name?.toLowerCase() || "";
        if (!f.name.toLowerCase().includes(q) && !farmName.includes(q) && !(f.county || "").toLowerCase().includes(q)) return false;
      }
      if (cropFilter !== "all" && f.crop !== cropFilter) return false;
      if (statusFilter !== "all" && f.status !== statusFilter) return false;
      return true;
    });
  }, [fields, search, cropFilter, statusFilter]);

  const totalAcres = filteredFields.reduce((a, f) => a + Number(f.acreage || 0), 0);

  const crops = useMemo(() => [...new Set(fields.map(f => f.crop))].sort(), [fields]);
  const statuses = useMemo(() => [...new Set(fields.map(f => f.status))].sort(), [fields]);

  const toggleFarm = (id: string) => setCollapsedFarms(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <AppShell title="Field Library">
      <div className="animate-fade-in space-y-4">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search fields, farms, counties…"
              className="h-8 pl-8 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <select value={cropFilter} onChange={e => setCropFilter(e.target.value)} className="h-8 rounded-md border bg-card px-2 text-xs text-foreground">
              <option value="all">All crops</option>
              {crops.map(c => <option key={c} value={c}>{formatCropType(c)}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-8 rounded-md border bg-card px-2 text-xs text-foreground">
              <option value="all">All statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button size="sm" variant="outline" onClick={() => setShowCreateFarm(true)} className="h-8 text-xs gap-1">
              <Building2 size={12} /> Farm
            </Button>
            <Button size="sm" onClick={() => setShowCreateField(true)} className="h-8 text-xs gap-1">
              <Plus size={12} /> Field
            </Button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground border-b pb-3">
          <span>{filteredFields.length} field{filteredFields.length !== 1 ? "s" : ""}</span>
          <span className="text-border">·</span>
          <span>{formatAcres(totalAcres)} total</span>
          <span className="text-border">·</span>
          <span>{farms.length} farm{farms.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Content */}
        {isLoading ? (
          <ListSkeleton rows={5} />
        ) : farms.length === 0 ? (
          <EmptyState
            icon={<Building2 size={24} />}
            title="No farms yet"
            description="Create your first farm to start building your field library. Fields are permanent records that carry all work history, files, and financial data."
            action={{ label: "Create First Farm", onClick: () => setShowCreateFarm(true) }}
          />
        ) : filteredFields.length === 0 && fields.length > 0 ? (
          <EmptyState
            icon={<Search size={24} />}
            title="No fields match filters"
            description="Try adjusting your search or filter criteria."
          />
        ) : filteredFields.length === 0 ? (
          <EmptyState
            icon={<Map size={24} />}
            title="No fields in your library"
            description="Add your first field to get started. Fields persist as permanent records — create once, reuse across all future jobs."
            action={{ label: "Add First Field", onClick: () => setShowCreateField(true) }}
          />
        ) : (
          <div className="space-y-3">
            {farms.map(farm => {
              const farmFields = filteredFields.filter(f => f.farm_id === farm.id);
              if (farmFields.length === 0) return null;
              const isCollapsed = collapsedFarms.has(farm.id);
              const farmAcres = farmFields.reduce((a, f) => a + Number(f.acreage || 0), 0);

              return (
                <div key={farm.id}>
                  {/* Farm header */}
                  <button
                    onClick={() => toggleFarm(farm.id)}
                    className="flex items-center gap-2 w-full text-left py-2 group"
                  >
                    {isCollapsed ? <ChevronR size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                    <Building2 size={13} className="text-muted-foreground" />
                    <span className="text-sm font-semibold">{farm.name}</span>
                    <span className="text-[11px] text-muted-foreground ml-1">
                      {farm.county && `${farm.county} Co., `}{farm.state}
                    </span>
                    <span className="text-[11px] text-muted-foreground ml-auto">
                      {farmFields.length} field{farmFields.length !== 1 ? "s" : ""} · {formatAcres(farmAcres)}
                    </span>
                  </button>

                  {/* Field rows */}
                  {!isCollapsed && (
                    <div className="rounded-lg border bg-card divide-y ml-5">
                      {farmFields.map(field => (
                        <Link
                          key={field.id}
                          to={`/fields/${field.id}`}
                          className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                              <Wheat size={14} className="text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{field.name}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {formatCropType(field.crop)} · {field.crop_year} · {formatAcres(Number(field.acreage))}
                                {field.county && ` · ${field.county} Co.`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <StatusBadge status={field.status} />
                            <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateFarmDialog open={showCreateFarm} onOpenChange={setShowCreateFarm} />
      <CreateFieldDialog open={showCreateField} onOpenChange={setShowCreateField} />
    </AppShell>
  );
}
