import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatAcres, formatCropType } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, FileText, History, MapPin, Wheat, X, Trash2 } from "lucide-react";
import { DeleteFieldDialog } from "@/components/fields/DeleteFieldDialog";

interface FieldData {
  id: string;
  name: string;
  acreage: number;
  status: string;
  crop?: string;
  crop_year?: number;
  county?: string | null;
  state?: string | null;
  centroid_lat?: number | null;
  centroid_lng?: number | null;
}

interface FieldQuickActionsProps {
  field: FieldData;
  onClose?: () => void;
  onStartJob?: (fieldId: string) => void;
}

export function FieldQuickActions({ field, onClose, onStartJob }: FieldQuickActionsProps) {
  const navigate = useNavigate();

  const handleStartJob = () => {
    if (onStartJob) {
      onStartJob(field.id);
    } else {
      // Navigate to job creation with field pre-selected
      navigate(`/jobs?new=1&fieldId=${field.id}`);
    }
  };

  const locationSummary = [field.county, field.state].filter(Boolean).join(", ");

  return (
    <div className="rounded-xl bg-card border shadow-xl p-4 w-[300px] space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Wheat size={14} className="text-primary shrink-0" />
            <h3 className="text-sm font-bold truncate">{field.name}</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatAcres(Number(field.acreage))}
            {field.crop && ` · ${formatCropType(field.crop)}`}
            {field.crop_year && ` · ${field.crop_year}`}
          </p>
          {locationSummary && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin size={10} /> {locationSummary}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusBadge status={field.status} />
          {onClose && (
            <button onClick={onClose} className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Location warning */}
      {!field.centroid_lat && (
        <div className="rounded-md bg-destructive/8 border border-destructive/20 px-2.5 py-1.5 text-[11px] text-destructive font-medium">
          ⚠ No boundary set — add location before posting jobs
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-1.5">
        <Button
          size="sm"
          className="h-9 text-xs gap-1.5 col-span-2"
          onClick={handleStartJob}
          disabled={!field.centroid_lat}
        >
          <Plus size={13} /> Start New Job
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1" asChild>
          <Link to={`/fields/${field.id}`}>
            <FileText size={12} /> View Field
          </Link>
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1" asChild>
          <Link to={`/fields/${field.id}?tab=jobs`}>
            <History size={12} /> Job History
          </Link>
        </Button>
      </div>
    </div>
  );
}
