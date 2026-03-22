import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Copy, Plus, Trash2, FileText, Loader2, Bookmark, ChevronRight,
  Sprout, SprayCan, Wheat as WheatIcon, Tractor,
} from "lucide-react";
import { OperationSpecForm } from "@/components/jobs/OperationSpecForm";
import { useJobTemplates, useCreateTemplate, useDeleteTemplate, type JobTemplate } from "@/hooks/useJobTemplates";
import type { OperationType, CropType, PricingModel } from "@/types/domain";
import { formatRelative } from "@/lib/format";

const OP_LABELS: Record<string, string> = {
  spraying: "Spraying", planting: "Planting", harvest: "Harvest", tillage: "Tillage",
  fertilizing: "Fertilizing", hauling: "Hauling", scouting: "Scouting",
  soil_sampling: "Soil Sampling", seeding: "Seeding", mowing: "Mowing / Hay Cutting",
  baling: "Baling", rock_picking: "Rock Picking", drainage: "Drainage", other: "Other",
};

const OP_ICONS: Record<string, typeof Sprout> = {
  planting: Sprout, spraying: SprayCan, harvest: WheatIcon, fertilizing: SprayCan,
  seeding: Sprout, tillage: Tractor,
};

const FILE_CATEGORIES = [
  "boundary", "prescription", "planting", "as_applied", "harvest",
  "soil_sample", "access_instructions",
];

// ── Template Card ────────────────────────────────────

function TemplateCard({
  template, onUse, onDelete,
}: {
  template: JobTemplate;
  onUse: (t: JobTemplate) => void;
  onDelete: (id: string) => void;
}) {
  const Icon = OP_ICONS[template.operation_type] || FileText;
  const specKeys = Object.keys(template.spec_data || {}).filter(k => template.spec_data[k]);
  const hasSpecs = specKeys.length > 0;

  return (
    <div className="group rounded-xl border bg-card hover:shadow-card transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Icon size={16} />
            </div>
            <div>
              <h4 className="text-sm font-semibold leading-tight">{template.name}</h4>
              <p className="text-[11px] text-muted-foreground capitalize">
                {OP_LABELS[template.operation_type] || template.operation_type}
                {template.crop !== "other" && ` · ${template.crop}`}
              </p>
            </div>
          </div>
          {template.is_shared && (
            <Badge variant="secondary" className="text-[10px]">Shared</Badge>
          )}
        </div>

        {template.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{template.description}</p>
        )}

        {/* Spec summary chips */}
        {hasSpecs && (
          <div className="flex flex-wrap gap-1 mb-3">
            {specKeys.slice(0, 4).map(k => (
              <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">
                {k.replace(/([A-Z])/g, " $1").trim()}
              </span>
            ))}
            {specKeys.length > 4 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                +{specKeys.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Required files */}
        {template.required_files.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-3">
            <FileText size={10} />
            {template.required_files.length} required file{template.required_files.length > 1 ? "s" : ""}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-[10px] text-muted-foreground tabular">
            Used {template.use_count}× · {formatRelative(template.created_at)}
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:text-destructive" onClick={() => onDelete(template.id)}>
              <Trash2 size={13} />
            </Button>
            <Button size="sm" className="h-7 gap-1" onClick={() => onUse(template)}>
              <Copy size={13} /> Use
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Create / Edit Dialog ─────────────────────────────

function CreateTemplateDialog({
  open, onOpenChange, initialData, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialData?: Partial<JobTemplate>;
  onSave: (data: any) => void;
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [operationType, setOperationType] = useState<OperationType>((initialData?.operation_type as OperationType) || "spraying");
  const [crop, setCrop] = useState<CropType>((initialData?.crop as CropType) || "other");
  const [pricingModel, setPricingModel] = useState<PricingModel>((initialData?.pricing_model as PricingModel) || "per_acre");
  const [baseRate, setBaseRate] = useState(initialData?.base_rate?.toString() || "");
  const [specData, setSpecData] = useState<Record<string, any>>(initialData?.spec_data || {});
  const [requiredFiles, setRequiredFiles] = useState<string[]>(initialData?.required_files || []);
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [requirements, setRequirements] = useState(initialData?.requirements || "");
  const [isShared, setIsShared] = useState(initialData?.is_shared || false);

  const toggleFile = (f: string) => {
    setRequiredFiles(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name, description: description || null, operation_type: operationType, crop,
      pricing_model: pricingModel, base_rate: parseFloat(baseRate) || 0,
      urgency: "normal", spec_data: specData, required_files: requiredFiles,
      contract_defaults: {}, comm_defaults: {},
      notes: notes || null, requirements: requirements || null, is_shared: isShared,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Job Template</DialogTitle>
          <DialogDescription>Save a reusable template for recurring work.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label>Template name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Spring corn planting — VR" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="What this template is for…" />
            </div>
          </div>

          {/* Operation & crop */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Operation type</Label>
              <Select value={operationType} onValueChange={v => setOperationType(v as OperationType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(OP_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Crop</Label>
              <Select value={crop} onValueChange={v => setCrop(v as CropType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["corn", "soybeans", "wheat", "alfalfa", "sorghum", "cover_crop", "other"].map(c => (
                    <SelectItem key={c} value={c}>{c.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Pricing model</Label>
              <Select value={pricingModel} onValueChange={v => setPricingModel(v as PricingModel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_acre">Per Acre</SelectItem>
                  <SelectItem value="per_hour">Per Hour</SelectItem>
                  <SelectItem value="flat_rate">Flat Rate</SelectItem>
                  <SelectItem value="negotiated">Negotiated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Default base rate ($)</Label>
              <Input type="number" value={baseRate} onChange={e => setBaseRate(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          {/* Operation specs */}
          <div className="border-t pt-4">
            <OperationSpecForm operationType={operationType} value={specData} onChange={setSpecData} />
          </div>

          {/* Required files */}
          <div className="border-t pt-4">
            <Label className="mb-3 block">Required files for this job type</Label>
            <div className="grid grid-cols-2 gap-2">
              {FILE_CATEGORIES.map(f => (
                <label key={f} className={cn(
                  "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors text-sm",
                  requiredFiles.includes(f) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                )}>
                  <Checkbox checked={requiredFiles.includes(f)} onCheckedChange={() => toggleFile(f)} />
                  {f.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-1 gap-3 border-t pt-4">
            <div className="space-y-1.5">
              <Label>Default notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Default requirements</Label>
              <Textarea value={requirements} onChange={e => setRequirements(e.target.value)} rows={2} />
            </div>
          </div>

          {/* Share toggle */}
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Share with organization</p>
              <p className="text-xs text-muted-foreground">Others in your org can use this template</p>
            </div>
            <Switch checked={isShared} onCheckedChange={setIsShared} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            <Bookmark size={14} className="mr-1.5" /> Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Template Picker (for job creation) ───────────────

export function TemplatePicker({
  onSelect, className,
}: {
  onSelect: (template: JobTemplate) => void;
  className?: string;
}) {
  const { data: templates, isLoading } = useJobTemplates();

  if (isLoading || !templates?.length) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Start from template</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {templates.slice(0, 5).map(t => {
          const Icon = OP_ICONS[t.operation_type] || FileText;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className="shrink-0 flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-muted/50 hover:border-primary/30 transition-all active:scale-[0.97]"
            >
              <Icon size={14} className="text-primary" />
              <span className="font-medium whitespace-nowrap">{t.name}</span>
              <ChevronRight size={12} className="text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Full Templates Page ──────────────────────────────

export default function JobTemplatesManager() {
  const { data: templates, isLoading } = useJobTemplates();
  const createMut = useCreateTemplate();
  const deleteMut = useDeleteTemplate();
  const [createOpen, setCreateOpen] = useState(false);

  const handleUse = (t: JobTemplate) => {
    // In a real app this would navigate to job creation pre-filled
    // For now, copy as new template
    setCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Job Templates</h2>
          <p className="text-sm text-muted-foreground">Save and reuse configurations for recurring work.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} className="mr-1.5" /> New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : !templates?.length ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-12 text-center">
          <Bookmark size={32} className="mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="text-sm font-semibold mb-1">No templates yet</h3>
          <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
            Create templates for your recurring jobs — planting specs, spray programs, harvest configs — to speed up job creation.
          </p>
          <Button variant="outline" onClick={() => setCreateOpen(true)}>
            <Plus size={14} className="mr-1" /> Create Your First Template
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map(t => (
            <TemplateCard
              key={t.id}
              template={t}
              onUse={handleUse}
              onDelete={(id) => deleteMut.mutate(id)}
            />
          ))}
        </div>
      )}

      <CreateTemplateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={(data) => createMut.mutate(data)}
      />
    </div>
  );
}
