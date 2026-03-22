import { Link } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { FieldMap } from "@/components/map/FieldMap";
import { Map, Plus, ArrowRight, Upload } from "lucide-react";
import { fields, farms, fieldStats } from "@/data/mock";
import { formatAcres, formatCropType, formatCurrency } from "@/lib/format";

const totalAcres = fields.reduce((a, f) => a + f.acreage, 0);

export default function FieldsPage() {
  return (
    <AppShell title="Fields">
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">{fields.length} fields · {formatAcres(totalAcres)} total across {farms.length} farms</p>
          <Button size="sm"><Plus size={14} /> Add Field</Button>
        </div>

        <div className="rounded-xl bg-card shadow-card mb-6 overflow-hidden">
          <FieldMap fields={fields} aspectRatio="21/9" />
        </div>

        {farms.map(farm => {
          const farmFields = fields.filter(f => f.farmId === farm.id);
          return (
            <div key={farm.id} className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{farm.name}</h3>
                  <p className="text-xs text-muted-foreground">{farm.county} County, {farm.state} · {formatAcres(farm.totalAcres)}</p>
                </div>
              </div>
              <div className="rounded-xl bg-card shadow-card divide-y">
                {farmFields.map(field => {
                  const stats = fieldStats[field.id];
                  return (
                    <Link key={field.id} to={`/fields/${field.id}`} className="flex items-center justify-between p-4 hover:bg-surface-2 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/8 flex items-center justify-center">
                          <Map size={18} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{field.name}</p>
                          <p className="text-xs text-muted-foreground">{formatCropType(field.crop)} · {field.cropYear} · {formatAcres(field.acreage)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {stats && <span className="text-xs text-muted-foreground tabular hidden sm:inline">{stats.totalJobs} jobs · {formatCurrency(stats.totalSpend)}</span>}
                        <StatusBadge status={field.status} />
                        <ArrowRight size={16} className="text-muted-foreground" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
