import { Link } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/PageSkeleton";
import { Map, Plus, ArrowRight, Upload } from "lucide-react";
import { useFields, useFarms } from "@/hooks/useFields";
import { formatAcres, formatCropType, formatCurrency } from "@/lib/format";

export default function FieldsPage() {
  const { data: fields = [], isLoading: fieldsLoading } = useFields();
  const { data: farms = [], isLoading: farmsLoading } = useFarms();

  const isLoading = fieldsLoading || farmsLoading;
  const totalAcres = fields.reduce((a, f) => a + Number(f.acreage || 0), 0);

  return (
    <AppShell title="Fields">
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-muted-foreground">
            {fields.length} field{fields.length !== 1 ? "s" : ""} · {formatAcres(totalAcres)} total across {farms.length} farm{farms.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline"><Upload size={14} /> Upload Shapefile</Button>
            <Button size="sm"><Plus size={14} /> Draw Field</Button>
          </div>
        </div>

        {isLoading ? (
          <ListSkeleton rows={5} />
        ) : fields.length === 0 ? (
          <EmptyState
            icon={<Map size={24} />}
            title="No fields yet"
            description="Upload a shapefile or draw your first field boundary on the map to get started."
            action={{ label: "Add Your First Field", to: "/fields" }}
          />
        ) : (
          <>
            {fields.length > 0 && (
              <div className="rounded-xl bg-card shadow-card mb-6 overflow-hidden">
                <FieldMap
                  fields={fields.map(f => ({
                    id: f.id,
                    name: f.name,
                    centroid: f.centroid_lat && f.centroid_lng ? { lat: Number(f.centroid_lat), lng: Number(f.centroid_lng) } : undefined,
                    boundingBox: f.bbox_north ? {
                      north: Number(f.bbox_north), south: Number(f.bbox_south),
                      east: Number(f.bbox_east), west: Number(f.bbox_west),
                    } : undefined,
                    acreage: Number(f.acreage),
                    crop: f.crop,
                    status: f.status,
                  }))}
                  aspectRatio="21/9"
                />
              </div>
            )}

            {farms.map(farm => {
              const farmFields = fields.filter(f => f.farm_id === farm.id);
              if (farmFields.length === 0) return null;
              return (
                <div key={farm.id} className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{farm.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {farm.county && `${farm.county} County, `}{farm.state} · {formatAcres(Number(farm.total_acres || 0))}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-card shadow-card divide-y">
                    {farmFields.map(field => (
                      <Link key={field.id} to={`/fields/${field.id}`} className="flex items-center justify-between p-4 hover:bg-surface-2 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-primary/8 flex items-center justify-center">
                            <Map size={18} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{field.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCropType(field.crop)} · {field.crop_year} · {formatAcres(Number(field.acreage))}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <StatusBadge status={field.status} />
                          <ArrowRight size={16} className="text-muted-foreground" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </AppShell>
  );
}
