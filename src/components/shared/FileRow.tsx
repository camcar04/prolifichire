import { cn } from "@/lib/utils";
import type { FileCategory } from "@/types/domain";
import { formatFileSize, formatDate } from "@/lib/format";
import { Download, FileText, Map, Image, FileSpreadsheet, File } from "lucide-react";
import { Button } from "@/components/ui/button";

const categoryIcons: Partial<Record<FileCategory, typeof FileText>> = {
  boundary: Map,
  prescription: FileSpreadsheet,
  planting: FileSpreadsheet,
  as_applied: FileSpreadsheet,
  harvest: FileSpreadsheet,
  soil_sample: FileSpreadsheet,
  photo: Image,
  completion_photo: Image,
  access_instructions: FileText,
  operator_notes: FileText,
  machine_data: File,
  invoice_doc: FileText,
};

const categoryLabels: Partial<Record<FileCategory, string>> = {
  boundary: "Boundary",
  prescription: "Prescription",
  planting: "Planting",
  as_applied: "As-Applied",
  harvest: "Harvest",
  soil_sample: "Soil Sample",
  photo: "Photo",
  completion_photo: "Completion Photo",
  access_instructions: "Access Notes",
  operator_notes: "Operator Notes",
  machine_data: "Machine Data",
  invoice_doc: "Invoice",
  insurance: "Insurance",
  certification: "Certification",
  other: "Other",
};

interface FileRowProps {
  fileName: string;
  category: FileCategory;
  fileSize: number;
  version?: number;
  uploadedBy?: string;
  cropYear?: number;
  linkedJob?: string;
  date: string;
  className?: string;
}

export function FileRow({ fileName, category, fileSize, version, uploadedBy, cropYear, linkedJob, date, className }: FileRowProps) {
  const Icon = categoryIcons[category] || File;
  const label = categoryLabels[category] || category;

  return (
    <div className={cn("flex items-center justify-between py-3 px-4 hover:bg-surface-2 transition-colors group", className)}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded bg-primary/8 flex items-center justify-center shrink-0">
          <Icon size={16} className="text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{fileName}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">{label}</span>
            {version && <span>v{version}</span>}
            <span>·</span>
            <span>{formatFileSize(fileSize)}</span>
            {uploadedBy && <><span>·</span><span>{uploadedBy}</span></>}
            {cropYear && <><span>·</span><span>{cropYear}</span></>}
            {linkedJob && <><span>·</span><span className="text-primary">{linkedJob}</span></>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-muted-foreground">{formatDate(date)}</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
          <Download size={14} />
        </Button>
      </div>
    </div>
  );
}

export function getCategoryLabel(category: FileCategory): string {
  return categoryLabels[category] || category;
}
