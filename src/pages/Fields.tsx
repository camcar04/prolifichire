import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/PageSkeleton";
import { CreateFarmDialog } from "@/components/fields/CreateFarmDialog";
import { CreateFieldDialog } from "@/components/fields/CreateFieldDialog";
import { CreateJobDialog } from "@/components/jobs/CreateJobDialog";
import { FarmFieldMap } from "@/components/map/FarmFieldMap";
import { FieldQuickActions } from "@/components/fields/FieldQuickActions";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Map, Plus, ArrowRight, Search, Building2, Wheat, ChevronDown, ChevronRight as ChevronR, Layers } from "lucide-react";
import { useFields, useFarms } from "@/hooks/useFields";
import { formatAcres, formatCropType } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function FieldsPage() {
  const navigate = useNavigate();
  const { data: fields = [], isLoading: fieldsLoading } = useFields();
  const { data: farms = [], isLoading: farmsLoading } = useFarms();
  const { position, requestPosition, loading: locating } = useGeolocation();
  const [search, setSearch] = useState("");
  const [cropFilter, setCropFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [collapsedFarms, setCollapsedFarms] = useState<Set<string>>(new Set());
  const [showCreateFarm, setShowCreateFarm] = useState(false);
  const [showCreateField, setShowCreateField] = useState(false);
  const [selectedField, setSelectedField] = useState<any>(null);
  const [activeFarmId, setActiveFarmId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");

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

  // Fields for map — show active farm or all
  const mapFields = useMemo(() => {
    const farmFields = activeFarmId
      ? filteredFields.filter(f => f.farm_id === activeFarmId)
      : filteredFields;
    return farmFields.filter(f => f.centroid_lat);
  }, [filteredFields, activeFarmId]);

  const toggleFarm = (id: string) => setCollapsedFarms(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleFieldSelect = (field: any) => {
    setSelectedField(field);
  };

  const handleStartJob = (fieldId: string) => {
    navigate(`/jobs?new=1&fieldId=${fieldId}`);
  };

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
            {/* View toggle */}
            <button
              onClick={() => setViewMode(viewMode === "map" ? "list" : "map")}
              className="h-8 w-8 rounded-md border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              title={viewMode === "map" ? "List view" : "Map view"}
            >
              {viewMode === "map" ? <Layers size={13} /> : <Map size={13} />}
            </button>
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
          {activeFarmId && (
            <>
              <span className="text-border">·</span>
              <button onClick={() => setActiveFarmId(null)} className="text-primary hover:underline">
                Show all farms
              </button>
            </>
          )}
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
        ) : (
          <>
            {/* Farm map view */}
            {viewMode === "map" && mapFields.length > 0 && (
              <div className="relative">
                <FarmFieldMap
                  fields={mapFields.map(f => ({
                    id: f.id,
                    name: f.name,
                    acreage: Number(f.acreage),
                    status: f.status,
                    centroid_lat: f.centroid_lat ? Number(f.centroid_lat) : null,
                    centroid_lng: f.centroid_lng ? Number(f.centroid_lng) : null,
                    bbox_north: f.bbox_north ? Number(f.bbox_north) : null,
                    bbox_south: f.bbox_south ? Number(f.bbox_south) : null,
                    bbox_east: f.bbox_east ? Number(f.bbox_east) : null,
                    bbox_west: f.bbox_west ? Number(f.bbox_west) : null,
                    boundary_geojson: f.boundary_geojson,
                  }))}
                  selectedFieldId={selectedField?.id}
                  onFieldSelect={(field) => {
                    const full = filteredFields.find(f => f.id === field.id);
                    handleFieldSelect(full || field);
                  }}
                  userLocation={position ? { lat: position.lat, lng: position.lng } : null}
                  onLocateMe={requestPosition}
                  locating={locating}
                  aspectRatio="21/9"
                  className="!rounded-xl"
                />

                {/* Quick actions popup */}
                {selectedField && (
                  <div className="absolute top-3 left-3 z-20">
                    <FieldQuickActions
                      field={{
                        id: selectedField.id,
                        name: selectedField.name,
                        acreage: Number(selectedField.acreage),
                        status: selectedField.status,
                        crop: selectedField.crop,
                        crop_year: selectedField.crop_year,
                        county: selectedField.county,
                        state: selectedField.state,
                        centroid_lat: selectedField.centroid_lat ? Number(selectedField.centroid_lat) : null,
                      }}
                      onClose={() => setSelectedField(null)}
                      onStartJob={handleStartJob}
                    />
                  </div>
                )}
              </div>
            )}

            {viewMode === "map" && mapFields.length === 0 && filteredFields.length > 0 && (
              <div className="rounded-xl border bg-muted/30 p-6 text-center">
                <Map size={20} className="mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No fields with boundaries to display on map.</p>
                <p className="text-xs text-muted-foreground mt-1">Draw boundaries on your fields to see them here.</p>
              </div>
            )}

            {/* Farm / field list */}
            <div className="space-y-2">
              {farms.map(farm => {
                const farmFields = filteredFields.filter(f => f.farm_id === farm.id);
                if (farmFields.length === 0 && !activeFarmId) return null;
                const isCollapsed = collapsedFarms.has(farm.id);
                const farmAcres = farmFields.reduce((a, f) => a + Number(f.acreage || 0), 0);
                const isActiveFarm = activeFarmId === farm.id;

                return (
                  <div key={farm.id}>
                    <button
                      onClick={() => {
                        toggleFarm(farm.id);
                        // Also focus map on this farm
                        setActiveFarmId(isActiveFarm ? null : farm.id);
                        setSelectedField(null);
                      }}
                      className={cn(
                        "flex items-center gap-2 w-full text-left py-2 px-1 rounded-md group transition-colors",
                        isActiveFarm && "bg-primary/5"
                      )}
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

                    {!isCollapsed && (
                      <div className="rounded border bg-card divide-y ml-5">
                        {farmFields.length === 0 ? (
                          <div className="px-4 py-6 text-center">
                            <p className="text-sm text-muted-foreground">No fields in this farm yet.</p>
                            <Button size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={() => setShowCreateField(true)}>
                              <Plus size={11} className="mr-1" /> Add Field
                            </Button>
                          </div>
                        ) : farmFields.map(field => (
                          <button
                            key={field.id}
                            onClick={() => handleFieldSelect(field)}
                            className={cn(
                              "flex items-center justify-between px-4 py-3 w-full text-left hover:bg-muted/50 transition-colors group",
                              selectedField?.id === field.id && "bg-primary/5"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={cn(
                                "h-8 w-8 rounded flex items-center justify-center shrink-0",
                                field.centroid_lat ? "bg-primary/10" : "bg-destructive/10"
                              )}>
                                {field.centroid_lat
                                  ? <Wheat size={14} className="text-primary" />
                                  : <Map size={14} className="text-destructive" />
                                }
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{field.name}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  {formatCropType(field.crop)} · {field.crop_year} · {formatAcres(Number(field.acreage))}
                                  {field.county && ` · ${field.county} Co.`}
                                  {!field.centroid_lat && " · No boundary"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <StatusBadge status={field.status} />
                              <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredFields.length === 0 && fields.length > 0 && (
              <EmptyState
                icon={<Search size={24} />}
                title="No fields match filters"
                description="Try adjusting your search or filter criteria."
              />
            )}
          </>
        )}
      </div>

      <CreateFarmDialog open={showCreateFarm} onOpenChange={setShowCreateFarm} />
      <CreateFieldDialog open={showCreateField} onOpenChange={setShowCreateField} />
    </AppShell>
  );
}
