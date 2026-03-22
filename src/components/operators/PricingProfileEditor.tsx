import { useState, useEffect } from "react";
import { useOperatorPricingProfile, useSavePricingProfile } from "@/hooks/useOperatorPricing";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatOperationType } from "@/lib/format";
import { toast } from "sonner";
import { Calculator, Save, Loader2, DollarSign, Percent, Truck, Fuel } from "lucide-react";
import type { OperationType } from "@/types/domain";

const SERVICE_TYPES: OperationType[] = [
  "spraying", "planting", "harvest", "grain_hauling", "fertilizing",
  "tillage", "hauling", "mowing", "baling", "rock_picking",
];

export function PricingProfileEditor() {
  const { data: profile, isLoading } = useOperatorPricingProfile();
  const saveMutation = useSavePricingProfile();

  const [targetPerAcre, setTargetPerAcre] = useState("");
  const [targetPerHour, setTargetPerHour] = useState("");
  const [minimumJobFee, setMinimumJobFee] = useState("");
  const [travelFeePerMile, setTravelFeePerMile] = useState("");
  const [fuelSurchargePct, setFuelSurchargePct] = useState("");
  const [haulingCostPerMile, setHaulingCostPerMile] = useState("");
  const [laborCostPerHour, setLaborCostPerHour] = useState("");
  const [desiredMarginPct, setDesiredMarginPct] = useState("20");
  const [serviceDefaults, setServiceDefaults] = useState<Record<string, { rate: number; method: string }>>({});

  useEffect(() => {
    if (profile) {
      setTargetPerAcre(profile.target_per_acre?.toString() || "");
      setTargetPerHour(profile.target_per_hour?.toString() || "");
      setMinimumJobFee(profile.minimum_job_fee?.toString() || "");
      setTravelFeePerMile(profile.travel_fee_per_mile?.toString() || "");
      setFuelSurchargePct(profile.fuel_surcharge_pct?.toString() || "");
      setHaulingCostPerMile(profile.hauling_cost_per_mile?.toString() || "");
      setLaborCostPerHour(profile.labor_cost_per_hour?.toString() || "");
      setDesiredMarginPct(profile.desired_margin_pct?.toString() || "20");
      setServiceDefaults(profile.service_defaults || {});
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({
        target_per_acre: parseFloat(targetPerAcre) || 0,
        target_per_hour: parseFloat(targetPerHour) || 0,
        minimum_job_fee: parseFloat(minimumJobFee) || 0,
        travel_fee_per_mile: parseFloat(travelFeePerMile) || 0,
        fuel_surcharge_pct: parseFloat(fuelSurchargePct) || 0,
        hauling_cost_per_mile: parseFloat(haulingCostPerMile) || 0,
        labor_cost_per_hour: parseFloat(laborCostPerHour) || 0,
        desired_margin_pct: parseFloat(desiredMarginPct) || 20,
        service_defaults: serviceDefaults,
      } as any);
      toast.success("Pricing profile saved");
    } catch (e: any) {
      toast.error(e.message || "Failed to save pricing profile");
    }
  };

  const updateServiceDefault = (type: string, rate: string) => {
    setServiceDefaults(prev => ({
      ...prev,
      [type]: { rate: parseFloat(rate) || 0, method: "per_acre" },
    }));
  };

  if (isLoading) {
    return (
      <div className="rounded-lg bg-card border p-5 animate-pulse">
        <div className="h-4 bg-muted rounded w-40 mb-4" />
        <div className="space-y-3">
          <div className="h-8 bg-muted rounded" />
          <div className="h-8 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-lg bg-card border p-5">
      <h2 className="text-sm font-semibold flex items-center gap-2 mb-1">
        <Calculator size={14} /> Private Costing Profile
      </h2>
      <p className="text-[11px] text-muted-foreground mb-4">
        Your cost assumptions are private. They power the cost calculator shown on every job you view.
      </p>

      <div className="space-y-4">
        {/* Global defaults */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Base Rates</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <PriceField icon={DollarSign} label="Target rate per acre" value={targetPerAcre} onChange={setTargetPerAcre} prefix="$" suffix="/ac" />
            <PriceField icon={DollarSign} label="Target rate per hour" value={targetPerHour} onChange={setTargetPerHour} prefix="$" suffix="/hr" />
            <PriceField icon={DollarSign} label="Minimum job fee" value={minimumJobFee} onChange={setMinimumJobFee} prefix="$" />
            <PriceField icon={Percent} label="Desired profit margin" value={desiredMarginPct} onChange={setDesiredMarginPct} suffix="%" />
          </div>
        </div>

        {/* Travel & fuel */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Travel & Fuel</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <PriceField icon={Truck} label="Travel fee per mile" value={travelFeePerMile} onChange={setTravelFeePerMile} prefix="$" suffix="/mi" />
            <PriceField icon={Fuel} label="Fuel surcharge" value={fuelSurchargePct} onChange={setFuelSurchargePct} suffix="%" />
            <PriceField icon={Truck} label="Hauling cost per mile" value={haulingCostPerMile} onChange={setHaulingCostPerMile} prefix="$" suffix="/mi" />
            <PriceField icon={DollarSign} label="Labor cost per hour" value={laborCostPerHour} onChange={setLaborCostPerHour} prefix="$" suffix="/hr" />
          </div>
        </div>

        {/* Service-specific rates */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Service-Specific Rates ($/acre)</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {SERVICE_TYPES.map(type => (
              <div key={type} className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground w-24 truncate">{formatOperationType(type)}</span>
                <div className="relative flex-1">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={serviceDefaults[type]?.rate?.toString() || ""}
                    onChange={e => updateServiceDefault(type, e.target.value)}
                    className="h-7 text-[11px] pl-5 pr-8"
                    placeholder="0.00"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground">/ac</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          size="sm"
          className="h-8 text-xs gap-1"
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          Save Pricing Profile
        </Button>
      </div>
    </section>
  );
}

function PriceField({ icon: Icon, label, value, onChange, prefix, suffix }: {
  icon: any; label: string; value: string; onChange: (v: string) => void; prefix?: string; suffix?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
        <Icon size={10} /> {label}
      </Label>
      <div className="relative">
        {prefix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">{prefix}</span>}
        <Input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`h-8 text-[12px] ${prefix ? "pl-6" : ""} ${suffix ? "pr-10" : ""}`}
          placeholder="0.00"
        />
        {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}
