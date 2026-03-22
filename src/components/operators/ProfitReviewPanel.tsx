import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useJobActuals, useSaveJobActuals, computeProfitReview, JobActuals,
} from "@/hooks/useJobActuals";
import { useOperatorPricingProfile } from "@/hooks/useOperatorPricing";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, Minus, DollarSign, Clock, Truck, Save,
  ChevronDown, ChevronUp, BarChart3,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  job: any;
}

export function ProfitReviewPanel({ job }: Props) {
  const { data: actuals, isLoading } = useJobActuals(job.id);
  const { data: pricingProfile } = useOperatorPricingProfile();
  const saveMutation = useSaveJobActuals();
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState<Partial<JobActuals>>({});

  const startEdit = () => {
    setForm({
      actual_hours: actuals?.actual_hours || 0,
      actual_travel_miles: actuals?.actual_travel_miles || 0,
      actual_acres: actuals?.actual_acres || Number(job.total_acres || 0),
      actual_loads: actuals?.actual_loads || 0,
      actual_fuel_cost: actuals?.actual_fuel_cost || 0,
      actual_labor_cost: actuals?.actual_labor_cost || 0,
      actual_equipment_cost: actuals?.actual_equipment_cost || 0,
      actual_other_cost: actuals?.actual_other_cost || 0,
      notes: actuals?.notes || "",
    });
    setEditing(true);
    setExpanded(true);
  };

  const handleSave = () => {
    saveMutation.mutate(
      { jobId: job.id, actuals: form },
      {
        onSuccess: () => { toast.success("Actuals saved"); setEditing(false); },
        onError: () => toast.error("Failed to save actuals"),
      }
    );
  };

  const review = computeProfitReview(job, actuals, pricingProfile || null);
  const payout = Number(job.paid_total || job.approved_total || job.estimated_total || 0);

  const verdictConfig = {
    beat_estimate: { label: "Beat Estimate", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    close: { label: "Close to Target", icon: Minus, color: "text-amber-600", bg: "bg-amber-500/10" },
    missed: { label: "Below Target", icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10" },
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-3 py-2 border-b bg-surface-2/50 hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <BarChart3 size={11} className="text-muted-foreground" />
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Profit Review
          </h3>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium ml-1">Private</span>
        </div>
        <div className="flex items-center gap-2">
          {review && (
            <span className={cn("text-[10px] font-semibold", verdictConfig[review.verdict].color)}>
              {review.actualMargin.toFixed(1)}% margin
            </span>
          )}
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      </button>

      {expanded && (
        <div className="p-3 space-y-3">
          {/* Summary comparison */}
          {review ? (
            <>
              <div className={cn("rounded-md px-3 py-2 flex items-center gap-2", verdictConfig[review.verdict].bg)}>
                {(() => { const V = verdictConfig[review.verdict]; return <V.icon size={14} className={V.color} />; })()}
                <span className={cn("text-[12px] font-semibold", verdictConfig[review.verdict].color)}>
                  {verdictConfig[review.verdict].label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <CompareRow label="Quoted" estimated={formatCurrency(review.quoted)} actual={formatCurrency(review.payout)} />
                <CompareRow label="Cost" estimated={formatCurrency(review.estimatedCost)} actual={formatCurrency(review.actualCost)} />
                <CompareRow label="Profit" estimated={formatCurrency(review.estimatedProfit)} actual={formatCurrency(review.actualProfit)} highlight />
                <CompareRow label="Margin" estimated={`${review.estimatedMargin}%`} actual={`${review.actualMargin}%`} highlight />
              </div>
            </>
          ) : (
            <div className="text-center py-3">
              <p className="text-[11px] text-muted-foreground mb-2">
                Enter your actual costs to see profit review
              </p>
              <p className="text-[10px] text-muted-foreground">
                Payout: <span className="font-semibold text-foreground">{formatCurrency(payout)}</span>
              </p>
            </div>
          )}

          {/* Actuals entry form */}
          {editing ? (
            <div className="space-y-2 pt-1 border-t">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Actual Costs</p>
              <div className="grid grid-cols-2 gap-2">
                <Field icon={<Clock size={10} />} label="Hours" value={form.actual_hours} onChange={(v) => setForm({ ...form, actual_hours: v })} />
                <Field icon={<Truck size={10} />} label="Travel (mi)" value={form.actual_travel_miles} onChange={(v) => setForm({ ...form, actual_travel_miles: v })} />
                <Field label="Acres" value={form.actual_acres} onChange={(v) => setForm({ ...form, actual_acres: v })} />
                <Field label="Loads" value={form.actual_loads} onChange={(v) => setForm({ ...form, actual_loads: v })} />
                <Field icon={<DollarSign size={10} />} label="Fuel $" value={form.actual_fuel_cost} onChange={(v) => setForm({ ...form, actual_fuel_cost: v })} />
                <Field label="Labor $" value={form.actual_labor_cost} onChange={(v) => setForm({ ...form, actual_labor_cost: v })} />
                <Field label="Equipment $" value={form.actual_equipment_cost} onChange={(v) => setForm({ ...form, actual_equipment_cost: v })} />
                <Field label="Other $" value={form.actual_other_cost} onChange={(v) => setForm({ ...form, actual_other_cost: v })} />
              </div>
              <Textarea
                placeholder="Notes (private)..."
                className="text-[11px] min-h-[48px]"
                value={form.notes || ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 h-7 text-[11px] gap-1" onClick={handleSave} disabled={saveMutation.isPending}>
                  <Save size={11} /> Save Actuals
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="w-full h-7 text-[11px]" onClick={startEdit}>
              {actuals ? "Edit Actuals" : "Enter Actual Costs"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function CompareRow({ label, estimated, actual, highlight }: { label: string; estimated: string; actual: string; highlight?: boolean }) {
  return (
    <>
      <div className="flex justify-between px-2 py-1 rounded bg-muted/30">
        <span className="text-muted-foreground">{label} (est)</span>
        <span className="font-medium tabular-nums">{estimated}</span>
      </div>
      <div className={cn("flex justify-between px-2 py-1 rounded", highlight ? "bg-primary/5" : "bg-muted/30")}>
        <span className="text-muted-foreground">{label} (actual)</span>
        <span className={cn("font-semibold tabular-nums", highlight && "text-primary")}>{actual}</span>
      </div>
    </>
  );
}

function Field({ icon, label, value, onChange }: { icon?: React.ReactNode; label: string; value: any; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-[9px] text-muted-foreground flex items-center gap-1 mb-0.5">
        {icon} {label}
      </label>
      <Input
        type="number"
        className="h-7 text-[11px] tabular-nums"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
