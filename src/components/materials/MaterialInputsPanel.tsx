import { cn } from "@/lib/utils";
import type { JobInput } from "@/types/domain";
import { formatDistance } from "@/lib/format";
import {
  Package, MapPin, Truck, Clock, AlertTriangle,
  Beaker, Wheat, Droplets, FlaskConical, Box,
  Navigation, Phone, FileText,
} from "lucide-react";

const TYPE_CONFIG: Record<string, { icon: typeof Package; label: string; color: string }> = {
  seed: { icon: Wheat, label: "Seed", color: "text-emerald-600 bg-emerald-600/8" },
  fertilizer: { icon: Droplets, label: "Fertilizer", color: "text-amber-600 bg-amber-600/8" },
  chemical: { icon: Beaker, label: "Chemical", color: "text-sky-600 bg-sky-600/8" },
  adjuvant: { icon: FlaskConical, label: "Adjuvant", color: "text-violet-600 bg-violet-600/8" },
  other: { icon: Box, label: "Product", color: "text-muted-foreground bg-muted" },
};

interface MaterialInputsPanelProps {
  inputs: JobInput[];
  showPickupDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export function MaterialInputsPanel({ inputs, showPickupDetails = true, compact = false, className }: MaterialInputsPanelProps) {
  if (inputs.length === 0) return null;

  const pickupInputs = inputs.filter(i => i.pickupRequired);
  const totalPickupDistance = pickupInputs.reduce((a, i) => a + (i.estimatedPickupDistance || 0), 0);
  const totalPickupTime = pickupInputs.reduce((a, i) => a + (i.estimatedPickupTime || 0), 0);

  return (
    <div className={cn("rounded-xl bg-card shadow-card overflow-hidden", className)}>
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Package size={15} />
          Materials & Inputs ({inputs.length})
        </h3>
        {pickupInputs.length > 0 && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-warning bg-warning/8 px-2 py-0.5 rounded-full">
            {pickupInputs.length} pickup{pickupInputs.length !== 1 ? "s" : ""} required
          </span>
        )}
      </div>

      <div className="divide-y">
        {inputs.map(input => (
          <MaterialInputRow key={input.id} input={input} showPickupDetails={showPickupDetails} compact={compact} />
        ))}
      </div>

      {/* Pickup summary */}
      {pickupInputs.length > 0 && showPickupDetails && (
        <div className="p-3 bg-warning/5 border-t border-warning/15">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-warning font-medium">
              <Truck size={13} />
              Pickup Route
            </div>
            {totalPickupDistance > 0 && (
              <span className="text-muted-foreground">+{formatDistance(totalPickupDistance)} added</span>
            )}
            {totalPickupTime > 0 && (
              <span className="text-muted-foreground">+{totalPickupTime} min</span>
            )}
            <span className="text-muted-foreground">
              {pickupInputs.length} stop{pickupInputs.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function MaterialInputRow({ input, showPickupDetails, compact }: { input: JobInput; showPickupDetails: boolean; compact: boolean }) {
  const config = TYPE_CONFIG[input.productType] || TYPE_CONFIG.other;
  const Icon = config.icon;

  return (
    <div className={cn("p-4", compact && "p-3")}>
      <div className="flex items-start gap-3">
        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", config.color)}>
          <Icon size={16} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium">{input.productName}</p>
            <span className={cn("text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded", config.color)}>
              {config.label}
            </span>
          </div>

          {/* Brand & variant */}
          {(input.brand || input.variant) && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {[input.brand, input.variant].filter(Boolean).join(" · ")}
            </p>
          )}

          {/* Quantity */}
          {input.quantity && input.unit && (
            <p className="text-xs text-muted-foreground mt-0.5 tabular">
              {input.quantity} {input.unit}
            </p>
          )}

          {/* Supply responsibility */}
          <div className="flex items-center gap-3 mt-2">
            <SupplyBadge suppliedBy={input.suppliedBy} />
            {input.pickupRequired && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-warning bg-warning/8 px-1.5 py-0.5 rounded flex items-center gap-1">
                <MapPin size={9} /> Pickup Required
              </span>
            )}
          </div>

          {/* Pickup details */}
          {input.pickupRequired && showPickupDetails && (
            <div className="mt-3 rounded-lg bg-surface-2 p-3 space-y-2">
              {input.pickupLocationName && (
                <div className="flex items-start gap-2 text-xs">
                  <MapPin size={12} className="text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{input.pickupLocationName}</p>
                    {input.pickupAddress && (
                      <p className="text-muted-foreground">
                        {input.pickupAddress}{input.pickupCity ? `, ${input.pickupCity}` : ""}{input.pickupState ? ` ${input.pickupState}` : ""} {input.pickupZip}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {(input.estimatedPickupDistance || input.estimatedPickupTime) && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {input.estimatedPickupDistance && (
                    <span className="flex items-center gap-1"><Navigation size={10} /> {formatDistance(input.estimatedPickupDistance)}</span>
                  )}
                  {input.estimatedPickupTime && (
                    <span className="flex items-center gap-1"><Clock size={10} /> {input.estimatedPickupTime} min</span>
                  )}
                </div>
              )}

              {input.pickupContact && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone size={10} />
                  <span>{input.pickupContact}{input.pickupPhone ? ` · ${input.pickupPhone}` : ""}</span>
                </div>
              )}

              {input.pickupInstructions && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <FileText size={10} className="mt-0.5 shrink-0" />
                  <span>{input.pickupInstructions}</span>
                </div>
              )}

              {input.handlingNotes && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertTriangle size={10} className="mt-0.5 shrink-0 text-warning" />
                  <span>{input.handlingNotes}</span>
                </div>
              )}

              {input.safetyNotes && (
                <div className="flex items-start gap-2 text-xs text-destructive/80">
                  <AlertTriangle size={10} className="mt-0.5 shrink-0" />
                  <span className="font-medium">{input.safetyNotes}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SupplyBadge({ suppliedBy }: { suppliedBy: string }) {
  const isGrower = suppliedBy === "grower";
  return (
    <span className={cn(
      "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
      isGrower ? "text-primary bg-primary/8" : "text-muted-foreground bg-muted"
    )}>
      {isGrower ? "Grower supplies" : "Operator supplies"}
    </span>
  );
}

// Compact summary for field packets and sidebar
export function MaterialsSummaryBadge({ inputs }: { inputs: JobInput[] }) {
  if (inputs.length === 0) return null;
  const pickups = inputs.filter(i => i.pickupRequired).length;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="flex items-center gap-1 text-muted-foreground">
        <Package size={12} /> {inputs.length} input{inputs.length !== 1 ? "s" : ""}
      </span>
      {pickups > 0 && (
        <span className="flex items-center gap-1 text-warning font-medium">
          <MapPin size={11} /> {pickups} pickup{pickups !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

// Pickup route summary for route/schedule pages
export function PickupRouteSummary({ inputs }: { inputs: JobInput[] }) {
  const pickups = inputs.filter(i => i.pickupRequired);
  if (pickups.length === 0) return null;

  const totalDist = pickups.reduce((a, i) => a + (i.estimatedPickupDistance || 0), 0);
  const totalTime = pickups.reduce((a, i) => a + (i.estimatedPickupTime || 0), 0);

  return (
    <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Truck size={14} className="text-warning" />
        <span className="text-xs font-semibold">Pickup Stops ({pickups.length})</span>
      </div>
      <div className="space-y-1.5">
        {pickups.map((p, i) => (
          <div key={p.id} className="flex items-center gap-2 text-xs">
            <span className="h-4 w-4 rounded-full bg-warning/15 text-warning flex items-center justify-center text-[9px] font-bold shrink-0">
              {i + 1}
            </span>
            <span className="font-medium truncate">{p.pickupLocationName || "Pickup"}</span>
            {p.estimatedPickupDistance && (
              <span className="text-muted-foreground ml-auto shrink-0">{formatDistance(p.estimatedPickupDistance)}</span>
            )}
          </div>
        ))}
      </div>
      {(totalDist > 0 || totalTime > 0) && (
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-warning/15 text-xs text-muted-foreground">
          {totalDist > 0 && <span>Total: {formatDistance(totalDist)}</span>}
          {totalTime > 0 && <span>+{totalTime} min</span>}
        </div>
      )}
    </div>
  );
}
