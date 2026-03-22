import { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface FieldDrawMapProps {
  initialGeojson?: GeoJSON.Polygon | null;
  onBoundaryChange: (geojson: GeoJSON.Polygon | null, acres: number) => void;
  className?: string;
  center?: { lat: number; lng: number };
  /** When true, map fills entire container with no border/radius */
  fullscreen?: boolean;
}

const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    "esri-sat": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "Esri, Maxar, Earthstar Geographics",
    },
  },
  layers: [
    { id: "satellite", type: "raster", source: "esri-sat", minzoom: 0, maxzoom: 19 },
  ],
};

// Calculate polygon area using Shoelace formula on spherical coordinates
function calculateAcres(coords: number[][]): number {
  if (coords.length < 3) return 0;
  const toRad = (d: number) => (d * Math.PI) / 180;
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    area += toRad(coords[j][0] - coords[i][0]) *
      (2 + Math.sin(toRad(coords[i][1])) + Math.sin(toRad(coords[j][1])));
  }
  area = Math.abs((area * 6378137 * 6378137) / 2);
  return area / 4046.8564224;
}

function getBbox(coords: number[][]) {
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return { west: minLng, east: maxLng, south: minLat, north: maxLat };
}

function getCentroid(coords: number[][]) {
  const n = coords.length;
  const sumLat = coords.reduce((a, c) => a + c[1], 0);
  const sumLng = coords.reduce((a, c) => a + c[0], 0);
  return { lat: sumLat / n, lng: sumLng / n };
}

export { calculateAcres, getBbox, getCentroid };

export function FieldDrawMap({ initialGeojson, onBoundaryChange, className, center, fullscreen }: FieldDrawMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [points, setPoints] = useState<number[][]>([]);
  const [polygon, setPolygon] = useState<GeoJSON.Polygon | null>(initialGeojson || null);
  const [acres, setAcres] = useState(0);
  const [isDrawing, setIsDrawing] = useState(!initialGeojson);
  const [isDragging, setIsDragging] = useState(false);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const pointsRef = useRef<number[][]>([]);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const dragIdxRef = useRef<number | null>(null);
  const liveAcresRef = useRef(0);

  const defaultCenter = center || { lat: 41.45, lng: -96.15 };

  // Report polygon to parent
  useEffect(() => {
    if (polygon) {
      const ring = polygon.coordinates[0];
      const a = calculateAcres(ring.slice(0, -1));
      setAcres(a);
      onBoundaryChange(polygon, a);
    }
  }, [polygon]);

  // Try to get user location for initial centering
  const locateUser = useCallback(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(loc);
        const map = mapRef.current;
        if (map && !polygon && pointsRef.current.length === 0) {
          map.flyTo({ center: [loc.lng, loc.lat], zoom: 15, duration: 1200 });
        }
        // Add/update user marker
        if (map) {
          if (!userMarkerRef.current) {
            const el = document.createElement("div");
            el.className = "w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg";
            el.style.boxShadow = "0 0 0 6px rgba(59,130,246,0.2), 0 2px 8px rgba(0,0,0,0.3)";
            userMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat([loc.lng, loc.lat]).addTo(map);
          } else {
            userMarkerRef.current.setLngLat([loc.lng, loc.lat]);
          }
        }
      },
      () => { /* denied or unavailable — no-op */ },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, [polygon]);

  // Init map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: SATELLITE_STYLE,
      center: [defaultCenter.lng, defaultCenter.lat],
      zoom: 15,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
      // Polygon fill + outline
      map.addSource("field-polygon", {
        type: "geojson",
        data: polygon
          ? { type: "Feature", properties: {}, geometry: polygon }
          : { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "field-fill", type: "fill", source: "field-polygon",
        paint: { "fill-color": "hsl(152, 55%, 45%)", "fill-opacity": 0.2 },
      });
      map.addLayer({
        id: "field-outline", type: "line", source: "field-polygon",
        paint: { "line-color": "hsl(152, 65%, 55%)", "line-width": 2.5 },
      });

      // Drawing line
      map.addSource("draw-line", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "draw-line-layer", type: "line", source: "draw-line",
        paint: { "line-color": "hsla(0,0%,100%,0.85)", "line-width": 2, "line-dasharray": [4, 3] },
      });

      // Live fill preview while drawing
      map.addSource("draw-fill", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "draw-fill-layer", type: "fill", source: "draw-fill",
        paint: { "fill-color": "hsl(152, 55%, 45%)", "fill-opacity": 0.12 },
      });

      // Fit to existing polygon
      if (polygon) {
        const ring = polygon.coordinates[0];
        const bounds = new maplibregl.LngLatBounds();
        ring.forEach(c => bounds.extend(c as [number, number]));
        map.fitBounds(bounds, { padding: 80, maxZoom: 17 });
      }

      // Auto-locate user if no center/polygon provided
      if (!center && !polygon) {
        locateUser();
      }
    });

    mapRef.current = map;
    return () => {
      markersRef.current.forEach(m => m.remove());
      userMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Drawing click handler
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      if (!isDrawing || isDragging) return;

      const pt: number[] = [e.lngLat.lng, e.lngLat.lat];

      // Check if clicking near first point to close
      if (pointsRef.current.length >= 3) {
        const first = pointsRef.current[0];
        const pixel = map.project(e.lngLat);
        const firstPixel = map.project(new maplibregl.LngLat(first[0], first[1]));
        const dist = Math.sqrt((pixel.x - firstPixel.x) ** 2 + (pixel.y - firstPixel.y) ** 2);
        if (dist < 20) {
          finishDraw();
          return;
        }
      }

      pointsRef.current = [...pointsRef.current, pt];
      setPoints([...pointsRef.current]);

      addVertexMarker(map, pt, pointsRef.current.length - 1, true);
      updateDrawPreview(map, pointsRef.current);
    };

    map.on("click", handleClick);
    return () => { map.off("click", handleClick); };
  }, [isDrawing, isDragging]);

  // Cursor
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor = isDrawing ? "crosshair" : "";
  }, [isDrawing]);

  function addVertexMarker(map: maplibregl.Map, pt: number[], idx: number, isDraw: boolean) {
    const el = document.createElement("div");
    const isFirst = idx === 0 && isDraw;
    el.className = cn(
      "rounded-full border-2 shadow-lg transition-transform",
      isFirst
        ? "w-4 h-4 bg-primary border-white cursor-pointer"
        : "w-3 h-3 bg-white border-primary/80 cursor-grab"
    );
    if (isFirst) el.title = "Click to close shape";

    const marker = new maplibregl.Marker({ element: el, draggable: !isDraw })
      .setLngLat(pt as [number, number])
      .addTo(map);

    if (!isDraw) {
      marker.on("dragstart", () => {
        setIsDragging(true);
        dragIdxRef.current = idx;
        el.style.transform += " scale(1.3)";
      });
      marker.on("drag", () => {
        const lngLat = marker.getLngLat();
        pointsRef.current[idx] = [lngLat.lng, lngLat.lat];
        updatePolygonSource(map, pointsRef.current);
        // Live acres during drag
        const a = calculateAcres(pointsRef.current);
        liveAcresRef.current = a;
        setAcres(a);
      });
      marker.on("dragend", () => {
        setIsDragging(false);
        dragIdxRef.current = null;
        el.style.transform = el.style.transform.replace(" scale(1.3)", "");
        const ring = [...pointsRef.current, pointsRef.current[0]];
        const poly: GeoJSON.Polygon = { type: "Polygon", coordinates: [ring] };
        setPolygon(poly);
      });
    }

    markersRef.current.push(marker);
  }

  function updateDrawPreview(map: maplibregl.Map, pts: number[][]) {
    const lineSrc = map.getSource("draw-line") as maplibregl.GeoJSONSource;
    const fillSrc = map.getSource("draw-fill") as maplibregl.GeoJSONSource;
    if (pts.length < 2) {
      lineSrc?.setData({ type: "FeatureCollection", features: [] });
      fillSrc?.setData({ type: "FeatureCollection", features: [] });
      return;
    }
    lineSrc?.setData({
      type: "Feature", properties: {},
      geometry: { type: "LineString", coordinates: [...pts, pts[0]] },
    });
    if (pts.length >= 3) {
      fillSrc?.setData({
        type: "Feature", properties: {},
        geometry: { type: "Polygon", coordinates: [[...pts, pts[0]]] },
      });
      const a = calculateAcres(pts);
      liveAcresRef.current = a;
      setAcres(a);
    }
  }

  function updatePolygonSource(map: maplibregl.Map, pts: number[][]) {
    const src = map.getSource("field-polygon") as maplibregl.GeoJSONSource;
    if (!src || pts.length < 3) return;
    const ring = [...pts, pts[0]];
    src.setData({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } });
  }

  const finishDraw = useCallback(() => {
    if (pointsRef.current.length < 3) return;
    const ring = [...pointsRef.current, pointsRef.current[0]];
    const poly: GeoJSON.Polygon = { type: "Polygon", coordinates: [ring] };
    setPolygon(poly);
    setIsDrawing(false);

    const map = mapRef.current;
    if (map) {
      const src = map.getSource("field-polygon") as maplibregl.GeoJSONSource;
      src?.setData({ type: "Feature", properties: {}, geometry: poly });
      (map.getSource("draw-line") as maplibregl.GeoJSONSource)?.setData({ type: "FeatureCollection", features: [] });
      (map.getSource("draw-fill") as maplibregl.GeoJSONSource)?.setData({ type: "FeatureCollection", features: [] });

      // Clear draw markers, add edit markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      pointsRef.current.forEach((pt, i) => addVertexMarker(map, pt, i, false));
    }

    setPoints([]);
  }, []);

  const clearDraw = () => {
    setPolygon(null);
    setPoints([]);
    pointsRef.current = [];
    setAcres(0);
    setIsDrawing(true);
    onBoundaryChange(null, 0);
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const map = mapRef.current;
    if (map) {
      (map.getSource("field-polygon") as maplibregl.GeoJSONSource)?.setData({ type: "FeatureCollection", features: [] });
      (map.getSource("draw-line") as maplibregl.GeoJSONSource)?.setData({ type: "FeatureCollection", features: [] });
      (map.getSource("draw-fill") as maplibregl.GeoJSONSource)?.setData({ type: "FeatureCollection", features: [] });
    }
  };

  const undoPoint = () => {
    if (pointsRef.current.length === 0) return;
    pointsRef.current = pointsRef.current.slice(0, -1);
    setPoints([...pointsRef.current]);
    const last = markersRef.current.pop();
    last?.remove();
    const map = mapRef.current;
    if (map) updateDrawPreview(map, pointsRef.current);
  };

  const redraw = () => {
    clearDraw();
  };

  return (
    <div className={cn(
      "relative bg-black",
      fullscreen ? "w-full h-full" : "rounded-lg overflow-hidden border",
      className
    )} style={fullscreen ? undefined : { aspectRatio: "16/10" }}>
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Bottom status bar */}
      <div className="absolute bottom-0 inset-x-0 z-20">
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
          {/* Left: acres */}
          <div className="text-white">
            {(acres > 0 || (isDrawing && points.length >= 3)) ? (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums tracking-tight">{acres.toFixed(1)}</span>
                <span className="text-sm text-white/70 font-medium">acres</span>
              </div>
            ) : isDrawing ? (
              <p className="text-sm text-white/70">
                {points.length === 0
                  ? "Tap map to place boundary points"
                  : points.length < 3
                    ? `${3 - points.length} more point${3 - points.length > 1 ? "s" : ""} to close`
                    : "Tap first point to close"}
              </p>
            ) : null}
          </div>

          {/* Right: draw controls */}
          <div className="flex items-center gap-2">
            {isDrawing && (
              <>
                <button onClick={undoPoint} disabled={points.length === 0}
                  className="h-10 px-3 rounded-lg bg-white/15 backdrop-blur-md text-white text-xs font-medium disabled:opacity-30 hover:bg-white/25 active:scale-95 transition-all">
                  Undo
                </button>
                {points.length >= 3 && (
                  <button onClick={finishDraw}
                    className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-lg hover:brightness-110 active:scale-95 transition-all">
                    Close Shape
                  </button>
                )}
              </>
            )}
            {!isDrawing && polygon && (
              <button onClick={redraw}
                className="h-10 px-3 rounded-lg bg-white/15 backdrop-blur-md text-white text-xs font-medium hover:bg-white/25 active:scale-95 transition-all">
                Redraw
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit mode hint */}
      {!isDrawing && polygon && !isDragging && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-[11px] text-white/80 font-medium pointer-events-none">
          Drag points to adjust boundary
        </div>
      )}
    </div>
  );
}
