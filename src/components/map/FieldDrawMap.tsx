import { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Map as MapIcon, Layers, Pencil, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface FieldDrawMapProps {
  initialGeojson?: GeoJSON.Polygon | null;
  onBoundaryChange: (geojson: GeoJSON.Polygon | null, acres: number) => void;
  className?: string;
  center?: { lat: number; lng: number };
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

const STREET_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

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
  // Convert square meters to acres
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

export function FieldDrawMap({ initialGeojson, onBoundaryChange, className, center }: FieldDrawMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [isSatellite, setIsSatellite] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<number[][]>([]);
  const [polygon, setPolygon] = useState<GeoJSON.Polygon | null>(initialGeojson || null);
  const [acres, setAcres] = useState(0);
  const pointsRef = useRef<number[][]>([]);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const defaultCenter = center || { lat: 41.45, lng: -96.15 };

  // Sync polygon with parent
  useEffect(() => {
    if (polygon) {
      const ring = polygon.coordinates[0];
      const a = calculateAcres(ring.slice(0, -1));
      setAcres(a);
      onBoundaryChange(polygon, a);
    }
  }, [polygon]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: isSatellite ? SATELLITE_STYLE : STREET_STYLE,
      center: [defaultCenter.lng, defaultCenter.lat],
      zoom: 14,
      attributionControl: false,
    });

    map.on("load", () => {
      // Add polygon source
      map.addSource("field-polygon", {
        type: "geojson",
        data: polygon ? { type: "Feature", properties: {}, geometry: polygon } : { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "field-fill", type: "fill", source: "field-polygon",
        paint: { "fill-color": "hsl(152, 50%, 38%)", "fill-opacity": 0.3 },
      });
      map.addLayer({
        id: "field-outline", type: "line", source: "field-polygon",
        paint: { "line-color": "hsl(152, 60%, 50%)", "line-width": 2.5 },
      });

      // Draw line source (while drawing)
      map.addSource("draw-line", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "draw-line-layer", type: "line", source: "draw-line",
        paint: { "line-color": "#fff", "line-width": 2, "line-dasharray": [3, 2] },
      });

      // Fit to existing polygon
      if (polygon) {
        const ring = polygon.coordinates[0];
        const bounds = new maplibregl.LngLatBounds();
        ring.forEach(c => bounds.extend(c as [number, number]));
        map.fitBounds(bounds, { padding: 60, maxZoom: 16 });
      }
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach(m => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle map clicks for drawing
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      if (!isDrawing) return;
      const pt: number[] = [e.lngLat.lng, e.lngLat.lat];
      pointsRef.current = [...pointsRef.current, pt];
      setPoints([...pointsRef.current]);

      // Add vertex marker
      const el = document.createElement("div");
      el.className = "w-3 h-3 rounded-full bg-white border-2 border-primary shadow-md";
      const marker = new maplibregl.Marker({ element: el }).setLngLat(e.lngLat).addTo(map);
      markersRef.current.push(marker);

      // Update draw line
      updateDrawLine(map, pointsRef.current);
    };

    map.on("click", handleClick);
    return () => { map.off("click", handleClick); };
  }, [isDrawing]);

  // Update cursor based on drawing state
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor = isDrawing ? "crosshair" : "";
  }, [isDrawing]);

  function updateDrawLine(map: maplibregl.Map, pts: number[][]) {
    const src = map.getSource("draw-line") as maplibregl.GeoJSONSource;
    if (!src || pts.length < 2) return;
    src.setData({
      type: "Feature", properties: {},
      geometry: { type: "LineString", coordinates: [...pts, pts[0]] },
    });
  }

  const startDraw = () => {
    // Clear existing
    clearDraw();
    setIsDrawing(true);
  };

  const finishDraw = useCallback(() => {
    if (pointsRef.current.length < 3) return;
    const ring = [...pointsRef.current, pointsRef.current[0]];
    const poly: GeoJSON.Polygon = { type: "Polygon", coordinates: [ring] };
    setPolygon(poly);
    setIsDrawing(false);

    // Update map
    const map = mapRef.current;
    if (map) {
      const src = map.getSource("field-polygon") as maplibregl.GeoJSONSource;
      src?.setData({ type: "Feature", properties: {}, geometry: poly });
      const lineSrc = map.getSource("draw-line") as maplibregl.GeoJSONSource;
      lineSrc?.setData({ type: "FeatureCollection", features: [] });
    }

    // Clear markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    pointsRef.current = [];
    setPoints([]);
  }, []);

  const clearDraw = () => {
    setPolygon(null);
    setPoints([]);
    pointsRef.current = [];
    setAcres(0);
    onBoundaryChange(null, 0);
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const map = mapRef.current;
    if (map) {
      const src = map.getSource("field-polygon") as maplibregl.GeoJSONSource;
      src?.setData({ type: "FeatureCollection", features: [] });
      const lineSrc = map.getSource("draw-line") as maplibregl.GeoJSONSource;
      lineSrc?.setData({ type: "FeatureCollection", features: [] });
    }
  };

  const undoPoint = () => {
    if (pointsRef.current.length === 0) return;
    pointsRef.current = pointsRef.current.slice(0, -1);
    setPoints([...pointsRef.current]);
    const last = markersRef.current.pop();
    last?.remove();
    const map = mapRef.current;
    if (map) updateDrawLine(map, pointsRef.current);
  };

  const toggleStyle = () => {
    const map = mapRef.current;
    if (!map) return;
    const newSat = !isSatellite;
    setIsSatellite(newSat);
    map.setStyle(newSat ? SATELLITE_STYLE : STREET_STYLE);
    map.once("style.load", () => {
      // Re-add sources/layers
      map.addSource("field-polygon", {
        type: "geojson",
        data: polygon ? { type: "Feature", properties: {}, geometry: polygon } : { type: "FeatureCollection", features: [] },
      });
      map.addLayer({ id: "field-fill", type: "fill", source: "field-polygon", paint: { "fill-color": "hsl(152, 50%, 38%)", "fill-opacity": 0.3 } });
      map.addLayer({ id: "field-outline", type: "line", source: "field-polygon", paint: { "line-color": "hsl(152, 60%, 50%)", "line-width": 2.5 } });
      map.addSource("draw-line", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "draw-line-layer", type: "line", source: "draw-line", paint: { "line-color": "#fff", "line-width": 2, "line-dasharray": [3, 2] } });
    });
  };

  return (
    <div className={cn("relative rounded-lg overflow-hidden border bg-muted", className)} style={{ aspectRatio: "16/10" }}>
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Map controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
        <button onClick={toggleStyle}
          className="h-7 w-7 rounded bg-card/90 backdrop-blur-sm shadow-card flex items-center justify-center text-xs text-foreground hover:bg-card transition-colors active:scale-95"
          title={isSatellite ? "Street view" : "Satellite view"}>
          <Layers size={14} />
        </button>
      </div>

      {/* Draw controls */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
        {!isDrawing && !polygon && (
          <Button size="sm" onClick={startDraw} className="h-7 text-[11px] gap-1 shadow-md">
            <Pencil size={11} /> Draw Boundary
          </Button>
        )}
        {!isDrawing && polygon && (
          <>
            <Button size="sm" variant="outline" onClick={startDraw} className="h-7 text-[11px] gap-1 bg-card/90 backdrop-blur-sm shadow-md">
              <Pencil size={11} /> Redraw
            </Button>
            <Button size="sm" variant="outline" onClick={clearDraw} className="h-7 text-[11px] gap-1 bg-card/90 backdrop-blur-sm shadow-md text-destructive hover:text-destructive">
              <Trash2 size={11} /> Clear
            </Button>
          </>
        )}
        {isDrawing && (
          <>
            <Button size="sm" onClick={finishDraw} disabled={points.length < 3}
              className="h-7 text-[11px] gap-1 shadow-md">
              Close Shape ({points.length} pts)
            </Button>
            <Button size="sm" variant="outline" onClick={undoPoint} disabled={points.length === 0}
              className="h-7 text-[11px] gap-1 bg-card/90 backdrop-blur-sm shadow-md">
              <Undo2 size={11} />
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setIsDrawing(false); clearDraw(); }}
              className="h-7 text-[11px] bg-card/90 backdrop-blur-sm shadow-md text-destructive hover:text-destructive">
              Cancel
            </Button>
          </>
        )}
      </div>

      {/* Acreage display */}
      {polygon && acres > 0 && (
        <div className="absolute bottom-3 left-3 rounded bg-card/90 backdrop-blur-sm px-3 py-1.5 shadow-md z-10">
          <p className="text-xs text-muted-foreground">Calculated Area</p>
          <p className="text-sm font-bold tabular-nums">{acres.toFixed(1)} acres</p>
        </div>
      )}

      {/* Drawing instructions */}
      {isDrawing && (
        <div className="absolute bottom-3 right-3 rounded bg-card/90 backdrop-blur-sm px-3 py-1.5 shadow-md z-10 max-w-[200px]">
          <p className="text-[11px] text-muted-foreground">Click to place points. Close the shape when done (min 3 points).</p>
        </div>
      )}

      {/* Coordinates */}
      {polygon && !isDrawing && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded bg-card/90 backdrop-blur-sm px-2 py-1 text-[10px] font-mono text-muted-foreground z-10">
          <MapIcon size={10} />
          {getCentroid(polygon.coordinates[0]).lat.toFixed(4)}°N, {Math.abs(getCentroid(polygon.coordinates[0]).lng).toFixed(4)}°W
        </div>
      )}
    </div>
  );
}
