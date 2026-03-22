import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { OperationType, PlantingSpec, ApplicationSpec, HarvestSpec, CropType } from "@/types/domain";

interface OperationSpecFormProps {
  operationType: OperationType;
  value: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

function PlantingSpecForm({ value, onChange }: { value: Partial<PlantingSpec>; onChange: (v: Partial<PlantingSpec>) => void }) {
  const set = (k: keyof PlantingSpec, v: any) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        Planting Specifications
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Seed brand</Label>
          <Input value={value.seedBrand || ""} onChange={e => set("seedBrand", e.target.value)} placeholder="e.g. DeKalb, Pioneer" />
        </div>
        <div className="space-y-1.5">
          <Label>Product line</Label>
          <Input value={value.productLine || ""} onChange={e => set("productLine", e.target.value)} placeholder="e.g. Asgrow" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Hybrid / Variety</Label>
          <Input value={value.hybridVariety || ""} onChange={e => set("hybridVariety", e.target.value)} placeholder="e.g. DKC62-53" />
        </div>
        <div className="space-y-1.5">
          <Label>Trait package</Label>
          <Input value={value.traitPackage || ""} onChange={e => set("traitPackage", e.target.value)} placeholder="e.g. VT2P RIB" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Treatment</Label>
          <Input value={value.treatment || ""} onChange={e => set("treatment", e.target.value)} placeholder="e.g. Acceleron" />
        </div>
        <div className="space-y-1.5">
          <Label>Target population (seeds/ac)</Label>
          <Input type="number" value={value.targetPopulation || ""} onChange={e => set("targetPopulation", parseInt(e.target.value) || 0)} placeholder="34000" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Row spacing (inches)</Label>
        <Input type="number" value={value.rowSpacing || ""} onChange={e => set("rowSpacing", parseFloat(e.target.value) || 0)} placeholder="30" />
      </div>
      <div className="space-y-1.5">
        <Label>Planting depth notes</Label>
        <Textarea value={value.plantingDepthNotes || ""} onChange={e => set("plantingDepthNotes", e.target.value)} placeholder="e.g. 2 inches, adjust for moisture" rows={2} />
      </div>
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Variable-rate planting</p>
          <p className="text-xs text-muted-foreground">Requires prescription map</p>
        </div>
        <Switch checked={value.variableRate || false} onCheckedChange={v => set("variableRate", v)} />
      </div>
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Prescription file required</p>
          <p className="text-xs text-muted-foreground">Upload in Files tab</p>
        </div>
        <Switch checked={value.prescriptionRequired || false} onCheckedChange={v => set("prescriptionRequired", v)} />
      </div>
      <div className="space-y-1.5">
        <Label>Seed supplied by</Label>
        <Select value={value.seedSuppliedBy || "owner"} onValueChange={v => set("seedSuppliedBy", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="owner">Owner / Grower</SelectItem>
            <SelectItem value="operator">Operator</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ApplicationSpecForm({ value, onChange }: { value: Partial<ApplicationSpec>; onChange: (v: Partial<ApplicationSpec>) => void }) {
  const set = (k: keyof ApplicationSpec, v: any) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        Application Specifications
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Product category</Label>
          <Input value={value.productCategory || ""} onChange={e => set("productCategory", e.target.value)} placeholder="e.g. Herbicide, Fungicide" />
        </div>
        <div className="space-y-1.5">
          <Label>Product / Brand / Blend</Label>
          <Input value={value.productBrandBlend || ""} onChange={e => set("productBrandBlend", e.target.value)} placeholder="e.g. Roundup PowerMax 3" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Form</Label>
          <Select value={value.form || "liquid"} onValueChange={v => set("form", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="dry">Dry</SelectItem>
              <SelectItem value="liquid">Liquid</SelectItem>
              <SelectItem value="gas">Gas</SelectItem>
              <SelectItem value="granular">Granular</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Rate type</Label>
          <Select value={value.rateType || "flat"} onValueChange={v => set("rateType", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="flat">Flat rate</SelectItem>
              <SelectItem value="split">Split</SelectItem>
              <SelectItem value="variable_rate">Variable rate</SelectItem>
              <SelectItem value="zone_based">Zone-based</SelectItem>
              <SelectItem value="see_and_spray">See-and-spray</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Target rate</Label>
          <Input type="number" value={value.targetRate || ""} onChange={e => set("targetRate", parseFloat(e.target.value) || 0)} placeholder="e.g. 32" />
        </div>
        <div className="space-y-1.5">
          <Label>Rate units</Label>
          <Input value={value.rateUnits || ""} onChange={e => set("rateUnits", e.target.value)} placeholder="oz/ac, gal/ac, lbs/ac" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Number of passes</Label>
          <Input type="number" value={value.numberOfPasses || ""} onChange={e => set("numberOfPasses", parseInt(e.target.value) || 1)} />
        </div>
        <div className="space-y-1.5">
          <Label>Pass timing</Label>
          <Input value={value.passTiming || ""} onChange={e => set("passTiming", e.target.value)} placeholder="e.g. Pre-emerge, V4" />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Operator supplies product</p>
          <p className="text-xs text-muted-foreground">Material cost will be passed through</p>
        </div>
        <Switch checked={value.operatorSuppliesProduct || false} onCheckedChange={v => set("operatorSuppliesProduct", v)} />
      </div>
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Prescription required</p>
          <p className="text-xs text-muted-foreground">Variable-rate or zone map</p>
        </div>
        <Switch checked={value.prescriptionRequired || false} onCheckedChange={v => set("prescriptionRequired", v)} />
      </div>
      <div className="space-y-1.5">
        <Label>Restricted-entry / Safety notes</Label>
        <Textarea value={value.restrictedEntryNotes || ""} onChange={e => set("restrictedEntryNotes", e.target.value)} placeholder="REI, PPE requirements, buffer zones…" rows={2} />
      </div>
      <div className="space-y-1.5">
        <Label>Special requirements & hazards</Label>
        <Textarea value={value.specialRequirements || ""} onChange={e => set("specialRequirements", e.target.value)} rows={2} />
      </div>
    </div>
  );
}

function HarvestSpecForm({ value, onChange }: { value: Partial<HarvestSpec>; onChange: (v: Partial<HarvestSpec>) => void }) {
  const set = (k: keyof HarvestSpec, v: any) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-warning" />
        Harvest Specifications
      </h3>
      <div className="space-y-1.5">
        <Label>Crop type</Label>
        <Select value={value.cropType || "corn"} onValueChange={v => set("cropType", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {["corn", "soybeans", "wheat", "sorghum", "oats", "barley", "other"].map(c => (
              <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Expected condition / moisture notes</Label>
        <Textarea value={value.conditionMoistureNotes || ""} onChange={e => set("conditionMoistureNotes", e.target.value)} placeholder="e.g. Standing, 18% moisture expected" rows={2} />
      </div>
      <div className="space-y-1.5">
        <Label>Unload / logistics notes</Label>
        <Textarea value={value.unloadLogisticsNotes || ""} onChange={e => set("unloadLogisticsNotes", e.target.value)} placeholder="e.g. Dump at bin site NE corner, truck hauling provided" rows={2} />
      </div>
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Planting file attached</p>
          <p className="text-xs text-muted-foreground">For yield map context</p>
        </div>
        <Switch checked={value.plantingFileAttached || false} onCheckedChange={v => set("plantingFileAttached", v)} />
      </div>
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Boundary file attached</p>
        </div>
        <Switch checked={value.boundaryFileAttached || false} onCheckedChange={v => set("boundaryFileAttached", v)} />
      </div>
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Yield data sharing expected</p>
          <p className="text-xs text-muted-foreground">Operator will provide yield maps</p>
        </div>
        <Switch checked={value.yieldDataSharingExpected || false} onCheckedChange={v => set("yieldDataSharingExpected", v)} />
      </div>
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Machine data delivery required</p>
          <p className="text-xs text-muted-foreground">ISOXML or raw machine files</p>
        </div>
        <Switch checked={value.machineDataRequired || false} onCheckedChange={v => set("machineDataRequired", v)} />
      </div>
    </div>
  );
}

export function OperationSpecForm({ operationType, value, onChange }: OperationSpecFormProps) {
  if (operationType === "planting" || operationType === "seeding") {
    return <PlantingSpecForm value={value} onChange={onChange} />;
  }
  if (operationType === "spraying" || operationType === "fertilizing") {
    return <ApplicationSpecForm value={value} onChange={onChange} />;
  }
  if (operationType === "harvest") {
    return <HarvestSpecForm value={value} onChange={onChange} />;
  }

  return (
    <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
      <p className="text-sm text-muted-foreground">
        No structured spec form for <span className="font-medium capitalize">{operationType.replace("_", " ")}</span>. Use the notes field below.
      </p>
    </div>
  );
}
