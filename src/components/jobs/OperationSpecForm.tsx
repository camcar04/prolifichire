import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { OperationType, PlantingSpec, ApplicationSpec, HarvestSpec, CropType, MowingSpec, BalingSpec, RockPickingSpec } from "@/types/domain";

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
            <SelectItem value="owner">Owner / Hire Work side</SelectItem>
            <SelectItem value="operator">Do Work side (Operator)</SelectItem>
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

function MowingSpecForm({ value, onChange }: { value: Partial<MowingSpec>; onChange: (v: Partial<MowingSpec>) => void }) {
  const set = (k: keyof MowingSpec, v: any) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Mowing / Hay Cutting Specifications
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Cutting</Label>
          <Select value={value.cuttingType || "first_cutting"} onValueChange={v => set("cuttingType", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["first_cutting", "second_cutting", "third_cutting", "fourth_cutting", "other"].map(c => (
                <SelectItem key={c} value={c}>{c.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Crop / Forage type</Label>
          <Select value={value.cropType || "alfalfa"} onValueChange={v => set("cropType", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["alfalfa", "grass_hay", "mixed_hay", "clover", "timothy", "orchard_grass", "other"].map(c => (
                <SelectItem key={c} value={c}>{c.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Cutting height</Label>
          <Input value={value.cuttingHeight || ""} onChange={e => set("cuttingHeight", e.target.value)} placeholder="e.g. 3 inches" />
        </div>
        <div className="space-y-1.5">
          <Label>Swath width</Label>
          <Input value={value.swathWidth || ""} onChange={e => set("swathWidth", e.target.value)} placeholder="e.g. 14 ft" />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Conditioner required</p>
          <p className="text-xs text-muted-foreground">Crimps/crushes stems for faster drying</p>
        </div>
        <Switch checked={value.conditionerRequired || false} onCheckedChange={v => set("conditionerRequired", v)} />
      </div>
      {value.conditionerRequired && (
        <div className="space-y-1.5">
          <Label>Conditioner type</Label>
          <Input value={value.conditionerType || ""} onChange={e => set("conditionerType", e.target.value)} placeholder="e.g. Roller, Impeller" />
        </div>
      )}
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Tedding required</p>
          <p className="text-xs text-muted-foreground">Spread and flip for even drying</p>
        </div>
        <Switch checked={value.teddingRequired || false} onCheckedChange={v => set("teddingRequired", v)} />
      </div>
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Raking required</p>
          <p className="text-xs text-muted-foreground">Windrow before baling</p>
        </div>
        <Switch checked={value.rakingRequired || false} onCheckedChange={v => set("rakingRequired", v)} />
      </div>
      <div className="space-y-1.5">
        <Label>Estimated dry time</Label>
        <Input value={value.estimatedDryTime || ""} onChange={e => set("estimatedDryTime", e.target.value)} placeholder="e.g. 2–3 days weather permitting" />
      </div>
      <div className="space-y-1.5">
        <Label>Field condition notes</Label>
        <Textarea value={value.fieldConditionNotes || ""} onChange={e => set("fieldConditionNotes", e.target.value)} placeholder="e.g. Gopher mounds on east side, wet spot NW corner" rows={2} />
      </div>
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Boundary file attached</p>
        </div>
        <Switch checked={value.boundaryFileAttached || false} onCheckedChange={v => set("boundaryFileAttached", v)} />
      </div>
    </div>
  );
}

function BalingSpecForm({ value, onChange }: { value: Partial<BalingSpec>; onChange: (v: Partial<BalingSpec>) => void }) {
  const set = (k: keyof BalingSpec, v: any) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Baling Specifications
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Bale type</Label>
          <Select value={value.baleType || "large_round"} onValueChange={v => set("baleType", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="small_square">Small Square</SelectItem>
              <SelectItem value="large_square">Large Square (3x3, 3x4)</SelectItem>
              <SelectItem value="large_round">Large Round</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Twine / Wrap type</Label>
          <Select value={value.twineOrWrapType || "net_wrap"} onValueChange={v => set("twineOrWrapType", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="twine">Twine</SelectItem>
              <SelectItem value="net_wrap">Net Wrap</SelectItem>
              <SelectItem value="plastic_wrap">Plastic Wrap (Silage)</SelectItem>
              <SelectItem value="sisal">Sisal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Bale size</Label>
          <Input value={value.baleSize || ""} onChange={e => set("baleSize", e.target.value)} placeholder='e.g. 4x5, 3x3x8' />
        </div>
        <div className="space-y-1.5">
          <Label>Target bale weight</Label>
          <Input value={value.baleWeight || ""} onChange={e => set("baleWeight", e.target.value)} placeholder="e.g. 1,200 lbs" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Estimated bale count</Label>
          <Input type="number" value={value.estimatedBaleCount || ""} onChange={e => set("estimatedBaleCount", parseInt(e.target.value) || 0)} placeholder="e.g. 85" />
        </div>
        <div className="space-y-1.5">
          <Label>Target moisture (%)</Label>
          <Input value={value.moistureTarget || ""} onChange={e => set("moistureTarget", e.target.value)} placeholder="e.g. 12–15%" />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Preservative required</p>
          <p className="text-xs text-muted-foreground">Propionic acid or similar for high-moisture baling</p>
        </div>
        <Switch checked={value.preservativeRequired || false} onCheckedChange={v => set("preservativeRequired", v)} />
      </div>
      {value.preservativeRequired && (
        <div className="space-y-1.5">
          <Label>Preservative type</Label>
          <Input value={value.preservativeType || ""} onChange={e => set("preservativeType", e.target.value)} placeholder="e.g. Harvest Tec propionic acid" />
        </div>
      )}
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Stacking required</p>
          <p className="text-xs text-muted-foreground">Operator stacks bales after baling</p>
        </div>
        <Switch checked={value.stackingRequired || false} onCheckedChange={v => set("stackingRequired", v)} />
      </div>
      {value.stackingRequired && (
        <div className="space-y-1.5">
          <Label>Stacking location</Label>
          <Input value={value.stackingLocation || ""} onChange={e => set("stackingLocation", e.target.value)} placeholder="e.g. NE corner of field, by barn" />
        </div>
      )}
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Loading required</p>
          <p className="text-xs text-muted-foreground">Operator loads bales onto trailer</p>
        </div>
        <Switch checked={value.loadingRequired || false} onCheckedChange={v => set("loadingRequired", v)} />
      </div>
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Hauling required</p>
          <p className="text-xs text-muted-foreground">Transport bales to destination</p>
        </div>
        <Switch checked={value.haulingRequired || false} onCheckedChange={v => set("haulingRequired", v)} />
      </div>
      {value.haulingRequired && (
        <div className="space-y-1.5">
          <Label>Hauling destination</Label>
          <Input value={value.haulingDestination || ""} onChange={e => set("haulingDestination", e.target.value)} placeholder="e.g. Barn 2 miles north on CR 400" />
        </div>
      )}
      <div className="space-y-1.5">
        <Label>Field condition notes</Label>
        <Textarea value={value.fieldConditionNotes || ""} onChange={e => set("fieldConditionNotes", e.target.value)} placeholder="e.g. Windrows ready, avoid wet area south side" rows={2} />
      </div>
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Boundary file attached</p>
        </div>
        <Switch checked={value.boundaryFileAttached || false} onCheckedChange={v => set("boundaryFileAttached", v)} />
      </div>
    </div>
  );
}

function RockPickingSpecForm({ value, onChange }: { value: Partial<RockPickingSpec>; onChange: (v: Partial<RockPickingSpec>) => void }) {
  const set = (k: keyof RockPickingSpec, v: any) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-stone-500" />
        Rock Picking Specifications
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Rock density estimate</Label>
          <Select value={value.rockDensity || "medium"} onValueChange={v => set("rockDensity", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low — Scattered</SelectItem>
              <SelectItem value="medium">Medium — Moderate</SelectItem>
              <SelectItem value="high">High — Heavy</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Estimated rock size</Label>
          <Select value={value.estimatedRockSize || "mixed"} onValueChange={v => set("estimatedRockSize", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small (fist-size)</SelectItem>
              <SelectItem value="mixed">Mixed sizes</SelectItem>
              <SelectItem value="large">Large (basketball+)</SelectItem>
              <SelectItem value="boulders">Boulders</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Equipment type (optional)</Label>
        <Input value={value.equipmentType || ""} onChange={e => set("equipmentType", e.target.value)} placeholder="e.g. Rock picker, skid steer, by hand" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Disposal method</Label>
          <Select value={value.disposalMethod || "pile_at_edge"} onValueChange={v => set("disposalMethod", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pile_on_field">Pile on field</SelectItem>
              <SelectItem value="pile_at_edge">Pile at field edge</SelectItem>
              <SelectItem value="haul_off">Haul off-site</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Disposal location</Label>
          <Input value={value.disposalLocation || ""} onChange={e => set("disposalLocation", e.target.value)} placeholder="e.g. NW corner pile" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Field condition notes</Label>
        <Textarea value={value.fieldConditionNotes || ""} onChange={e => set("fieldConditionNotes", e.target.value)} placeholder="e.g. Heavy rocks on east 40, mostly clear west side" rows={2} />
      </div>
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Boundary file attached</p>
        </div>
        <Switch checked={value.boundaryFileAttached || false} onCheckedChange={v => set("boundaryFileAttached", v)} />
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
  if (operationType === "mowing") {
    return <MowingSpecForm value={value} onChange={onChange} />;
  }
  if (operationType === "baling") {
    return <BalingSpecForm value={value} onChange={onChange} />;
  }
  if (operationType === "rock_picking") {
    return <RockPickingSpecForm value={value} onChange={onChange} />;
  }

  return (
    <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
      <p className="text-sm text-muted-foreground">
        No structured spec form for <span className="font-medium capitalize">{operationType.replace("_", " ")}</span>. Use the notes field below.
      </p>
    </div>
  );
}
