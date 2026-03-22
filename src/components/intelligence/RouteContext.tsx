import { MapPin, Navigation, Clock, Truck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistance } from "@/lib/format";
import type { GeoPoint } from "@/lib/routing";
import { haversineDistance, estimateTravelMinutes, isRouteCompatible, type RouteStop } from "@/lib/routing";

interface RouteContextProps {
  operatorBase: GeoPoint | null;
  fieldLocation: GeoPoint | null;
  existingStops?: RouteStop[];
  className?: string;
}

export function RouteContextBadge({ operatorBase, fieldLocation, existingStops = [], className }: RouteContextProps) {
  if (!operatorBase || !fieldLocation) return null;

  const distFromBase = haversineDistance(operatorBase, fieldLocation);
  const travelMins = estimateTravelMinutes(distFromBase);
  const routeCheck = isRouteCompatible(operatorBase, existingStops, fieldLocation);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-surface-2 rounded-full px-2.5 py-1">
        <MapPin size={12} />
        <span>{formatDistance(distFromBase)} from shop</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-surface-2 rounded-full px-2.5 py-1">
        <Clock size={12} />
        <span>{travelMins} min drive</span>
      </div>
      {routeCheck.compatible && existingStops.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-success bg-success/8 rounded-full px-2.5 py-1 font-medium">
          <CheckCircle2 size={12} />
          <span>Fits route ({routeCheck.detourMiles} mi detour)</span>
        </div>
      )}
      {!routeCheck.compatible && existingStops.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-surface-2 rounded-full px-2.5 py-1">
          <Navigation size={12} />
          <span>{routeCheck.detourMiles} mi from route</span>
        </div>
      )}
    </div>
  );
}

interface RouteStatsProps {
  totalMiles: number;
  totalMinutes: number;
  stopCount: number;
  className?: string;
}

export function RouteStatsBar({ totalMiles, totalMinutes, stopCount, className }: RouteStatsProps) {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return (
    <div className={cn("flex items-center gap-4 rounded-lg bg-surface-2 px-4 py-2.5", className)}>
      <div className="flex items-center gap-1.5 text-sm">
        <Truck size={14} className="text-primary" />
        <span className="font-medium tabular">{totalMiles.toFixed(1)} mi</span>
        <span className="text-muted-foreground">total</span>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-1.5 text-sm">
        <Clock size={14} className="text-primary" />
        <span className="font-medium tabular">
          {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
        </span>
        <span className="text-muted-foreground">drive time</span>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-1.5 text-sm">
        <MapPin size={14} className="text-primary" />
        <span className="font-medium tabular">{stopCount}</span>
        <span className="text-muted-foreground">stops</span>
      </div>
    </div>
  );
}
