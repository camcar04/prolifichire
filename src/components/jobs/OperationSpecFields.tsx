import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Per-operation structured spec fields. Persisted in operation_specs.spec_data (JSONB)
 * and (for product) job_inputs. Critical operator-facing inputs are required.
 */
export interface OperationSpec {
  product_name?: string;
  product_type?: string;        // herbicide / fungicide / fertilizer / etc
  target_rate?: string;         // numeric string
  rate_unit?: string;           // gal/ac, lb/ac
  water_source?: string;        // grower_provided | operator_sources | not_applicable
  row_spacing?: string;         // inches
  variety?: string;             // seed variety / hybrid
  moisture_target?: string;     // % moisture
  truck_logistics?: string;     // grower_provides_cart | operator_brings_cart | not_applicable
}

const REQ = <span className="text-destructive ml-0.5">*</span>;

interface Props {
  opType: string;
  value: OperationSpec;
  onChange: (next: OperationSpec) => void;
}

export function OperationSpecFields({ opType, value, onChange }: Props) {
  const set = (patch: Partial<OperationSpec>) => onChange({ ...value, ...patch });

  const isApplication = opType === "spraying" || opType === "fertilizing";
  const isPlanting = opType === "planting";
  const isHarvest = opType === "harvest";

  if (!isApplication && !isPlanting && !isHarvest) return null;

  return (
    <div className="space-y-4 rounded border border-border/60 bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Operation Details
        </p>
        <span className="text-[10px] text-muted-foreground">Required for accurate quotes</span>
      </div>

      {isApplication && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">Product / material{REQ}</Label>
              <Input
                value={value.product_name || ""}
                onChange={e => set({ product_name: e.target.value })}
                placeholder="e.g. Roundup PowerMax, Liberty 280, 32-0-0 UAN"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Product type{REQ}</Label>
              <Select value={value.product_type || ""} onValueChange={v => set({ product_type: v })}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="herbicide">Herbicide</SelectItem>
                  <SelectItem value="fungicide">Fungicide</SelectItem>
                  <SelectItem value="insecticide">Insecticide</SelectItem>
                  <SelectItem value="fertilizer_dry">Fertilizer (dry)</SelectItem>
                  <SelectItem value="fertilizer_liquid">Fertilizer (liquid)</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Target rate{REQ}</Label>
              <div className="flex gap-1.5">
                <Input
                  type="number"
                  step="0.1"
                  value={value.target_rate || ""}
                  onChange={e => set({ target_rate: e.target.value })}
                  placeholder="e.g. 15"
                />
                <Select value={value.rate_unit || "gal/ac"} onValueChange={v => set({ rate_unit: v })}>
                  <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gal/ac">gal/ac</SelectItem>
                    <SelectItem value="oz/ac">oz/ac</SelectItem>
                    <SelectItem value="lb/ac">lb/ac</SelectItem>
                    <SelectItem value="ton/ac">ton/ac</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Water source{REQ}</Label>
            <Select value={value.water_source || ""} onValueChange={v => set({ water_source: v })}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="grower_provided">Grower provides on-site</SelectItem>
                <SelectItem value="operator_sources">Operator must source water</SelectItem>
                <SelectItem value="not_applicable">Not applicable (dry product)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {isPlanting && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Row spacing (in){REQ}</Label>
            <Input
              type="number"
              step="1"
              value={value.row_spacing || ""}
              onChange={e => set({ row_spacing: e.target.value })}
              placeholder="e.g. 30"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Variety / seed{REQ}</Label>
            <Input
              value={value.variety || ""}
              onChange={e => set({ variety: e.target.value })}
              placeholder="e.g. Pioneer P1197AM"
            />
          </div>
        </div>
      )}

      {isHarvest && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Moisture target (%){REQ}</Label>
            <Input
              type="number"
              step="0.1"
              value={value.moisture_target || ""}
              onChange={e => set({ moisture_target: e.target.value })}
              placeholder="e.g. 15"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Truck / cart logistics{REQ}</Label>
            <Select value={value.truck_logistics || ""} onValueChange={v => set({ truck_logistics: v })}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="grower_provides_cart">Grower provides grain cart</SelectItem>
                <SelectItem value="operator_brings_cart">Operator brings own cart</SelectItem>
                <SelectItem value="not_applicable">Not applicable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}

/** Validate spec — returns array of human-readable missing field labels. */
export function validateOperationSpec(opType: string, spec: OperationSpec): string[] {
  const missing: string[] = [];
  const isApplication = opType === "spraying" || opType === "fertilizing";
  if (isApplication) {
    if (!spec.product_name?.trim()) missing.push("Product / material");
    if (!spec.product_type) missing.push("Product type");
    if (!spec.target_rate || Number(spec.target_rate) <= 0) missing.push("Target rate");
    if (!spec.water_source) missing.push("Water source");
  }
  if (opType === "planting") {
    if (!spec.row_spacing || Number(spec.row_spacing) <= 0) missing.push("Row spacing");
    if (!spec.variety?.trim()) missing.push("Variety / seed");
  }
  if (opType === "harvest") {
    if (!spec.moisture_target || Number(spec.moisture_target) <= 0) missing.push("Moisture target");
    if (!spec.truck_logistics) missing.push("Truck / cart logistics");
  }
  return missing;
}