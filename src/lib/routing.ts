/**
 * Routing & Clustering Engine
 * Client-side haversine-based routing, clustering, and distance calculations
 */

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface RouteStop {
  id: string;
  label: string;
  location: GeoPoint;
  acreage: number;
  operationType: string;
  jobId: string;
  scheduledStart?: string;
}

export interface RouteSegment {
  from: RouteStop;
  to: RouteStop;
  distanceMiles: number;
  estimatedMinutes: number;
}

export interface RouteResult {
  stops: RouteStop[];
  segments: RouteSegment[];
  totalMiles: number;
  totalMinutes: number;
}

export interface JobCluster {
  id: string;
  label: string;
  centroid: GeoPoint;
  jobs: RouteStop[];
  radiusMiles: number;
  totalAcres: number;
}

const EARTH_RADIUS_MILES = 3959;
const AVG_SPEED_MPH = 35; // rural driving average

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistance(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLon * sinLon;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function estimateTravelMinutes(distanceMiles: number): number {
  return Math.round((distanceMiles / AVG_SPEED_MPH) * 60);
}

/**
 * Nearest-neighbor greedy route optimization
 */
export function optimizeRoute(origin: GeoPoint, stops: RouteStop[]): RouteResult {
  if (stops.length === 0) return { stops: [], segments: [], totalMiles: 0, totalMinutes: 0 };

  const remaining = [...stops];
  const ordered: RouteStop[] = [];
  const segments: RouteSegment[] = [];
  let currentPos = origin;
  let totalMiles = 0;

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineDistance(currentPos, remaining[i].location);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const nextStop = remaining.splice(bestIdx, 1)[0];
    const dist = haversineDistance(currentPos, nextStop.location);
    const mins = estimateTravelMinutes(dist);

    if (ordered.length > 0) {
      segments.push({ from: ordered[ordered.length - 1], to: nextStop, distanceMiles: dist, estimatedMinutes: mins });
    } else {
      // Origin to first stop
      segments.push({
        from: { id: "origin", label: "Shop/Yard", location: origin, acreage: 0, operationType: "", jobId: "" },
        to: nextStop,
        distanceMiles: dist,
        estimatedMinutes: mins,
      });
    }

    totalMiles += dist;
    currentPos = nextStop.location;
    ordered.push(nextStop);
  }

  return {
    stops: ordered,
    segments,
    totalMiles,
    totalMinutes: segments.reduce((a, s) => a + s.estimatedMinutes, 0),
  };
}

/**
 * Simple clustering: group jobs within clusterRadiusMiles of each other
 */
export function clusterJobs(stops: RouteStop[], clusterRadiusMiles: number = 15): JobCluster[] {
  const assigned = new Set<string>();
  const clusters: JobCluster[] = [];

  // Sort by acreage descending to seed clusters with biggest jobs
  const sorted = [...stops].sort((a, b) => b.acreage - a.acreage);

  for (const seed of sorted) {
    if (assigned.has(seed.id)) continue;

    const members = [seed];
    assigned.add(seed.id);

    for (const candidate of sorted) {
      if (assigned.has(candidate.id)) continue;
      if (haversineDistance(seed.location, candidate.location) <= clusterRadiusMiles) {
        members.push(candidate);
        assigned.add(candidate.id);
      }
    }

    const centroid: GeoPoint = {
      lat: members.reduce((a, m) => a + m.location.lat, 0) / members.length,
      lng: members.reduce((a, m) => a + m.location.lng, 0) / members.length,
    };

    // Calculate the max distance from centroid as radius
    const radius = Math.max(...members.map((m) => haversineDistance(centroid, m.location)), 1);

    // Generate label from direction
    const direction = getDirectionLabel(centroid);

    clusters.push({
      id: `cluster-${clusters.length + 1}`,
      label: `${direction} Cluster – ${members.length} job${members.length > 1 ? "s" : ""}`,
      centroid,
      jobs: members,
      radiusMiles: Math.round(radius * 10) / 10,
      totalAcres: members.reduce((a, m) => a + m.acreage, 0),
    });
  }

  return clusters;
}

function getDirectionLabel(point: GeoPoint): string {
  // Simple cardinal labeling based on lat/lng offsets from center of NE
  const NE_CENTER = { lat: 41.5, lng: -96.5 };
  const ns = point.lat > NE_CENTER.lat ? "North" : "South";
  const ew = point.lng > NE_CENTER.lng ? "East" : "West";
  return `${ns}${ew}`;
}

/**
 * Check if a job is "route-compatible" with existing scheduled jobs
 */
export function isRouteCompatible(
  operatorBase: GeoPoint,
  existingStops: RouteStop[],
  candidateLocation: GeoPoint,
  maxDetourMiles: number = 15
): { compatible: boolean; detourMiles: number; nearestJobLabel?: string } {
  if (existingStops.length === 0) {
    const dist = haversineDistance(operatorBase, candidateLocation);
    return { compatible: dist <= maxDetourMiles * 3, detourMiles: dist };
  }

  let minDetour = Infinity;
  let nearestLabel = "";

  for (const stop of existingStops) {
    const detour = haversineDistance(stop.location, candidateLocation);
    if (detour < minDetour) {
      minDetour = detour;
      nearestLabel = stop.label;
    }
  }

  return {
    compatible: minDetour <= maxDetourMiles,
    detourMiles: Math.round(minDetour * 10) / 10,
    nearestJobLabel: nearestLabel,
  };
}

/**
 * Calculate pricing factors based on routing
 */
export function calculateRoutingPriceFactors(
  operatorBase: GeoPoint,
  fieldLocation: GeoPoint,
  existingStops: RouteStop[]
): { travelCost: number; clusterDiscount: number; deadheadMiles: number } {
  const distFromBase = haversineDistance(operatorBase, fieldLocation);
  const travelCostPerMile = 3.50;

  // Check if this field is near existing stops
  let minDistFromRoute = distFromBase;
  for (const stop of existingStops) {
    const d = haversineDistance(stop.location, fieldLocation);
    if (d < minDistFromRoute) minDistFromRoute = d;
  }

  const travelCost = Math.round(minDistFromRoute * travelCostPerMile * 100) / 100;
  const clusterDiscount = minDistFromRoute < distFromBase * 0.5 ? Math.round(travelCost * 0.3 * 100) / 100 : 0;

  return {
    travelCost,
    clusterDiscount,
    deadheadMiles: Math.round(distFromBase * 10) / 10,
  };
}
