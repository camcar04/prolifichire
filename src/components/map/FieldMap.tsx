import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Map as MapIcon, Layers } from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/** Accepts real DB field data — not the mock domain type */
interface FieldData {
  id: string;
  name: string;
  acreage: number;
  status: string;
  centroid_lat?: number | null;
  centroid_lng?: number | null;
  bbox_north?: number | null;
  bbox_south?: number | null;
  bbox_east?: number | null;
  bbox_west?: number | null;
  boundary_geojson?: any;
}

interface FieldMapProps {
  field?: FieldData;
  fields?: FieldData[];
  className?: string;
  aspectRatio?: string;
  showControls?: boolean;
  overlay?: React.ReactNode;
  satelliteDefault?: boolean;
}

const STREET_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
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

function getFieldGeometry(f: FieldData): GeoJSON.Feature<GeoJSON.Polygon> | null {
  // Prefer real boundary_geojson
  if (f.boundary_geojson?.coordinates?.length) {
    return {
      type: "Feature",
      properties: { name: f.name, acreage: f.acreage, status: f.status },
      geometry: f.boundary_geojson,
    };
  }
  // Fall back to bbox rectangle
  if (f.bbox_north && f.bbox_south && f.bbox_east && f.bbox_west) {
    return {
      type: "Feature",
      properties: { name: f.name, acreage: f.acreage, status: f.status },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [Number(f.bbox_west), Number(f.bbox_south)],
          [Number(f.bbox_east), Number(f.bbox_south)],
          [Number(f.bbox_east), Number(f.bbox_north)],
          [Number(f.bbox_west), Number(f.bbox_north)],
          [Number(f.bbox_west), Number(f.bbox_south)],
        ]],
      },
    };
  }
  return null;
}

function addFieldLayers(map: maplibregl.Map, allFields: FieldData[]) {
  allFields.forEach((f) => {
    const sourceId = `field-${f.id}`;
    if (map.getSource(sourceId)) return;

    const feature = getFieldGeometry(f);
    if (!feature) return;

    map.addSource(sourceId, { type: "geojson", data: feature });

    map.addLayer({
      id: `${sourceId}-fill`,
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": f.status === "active" ? "hsl(152, 50%, 38%)" : "hsl(152, 40%, 45%)",
        "fill-opacity": 0.25,
      },
    });

    map.addLayer({
      id: `${sourceId}-outline`,
      type: "line",
      source: sourceId,
      paint: {
        "line-color": "hsl(152, 55%, 40%)",
        "line-width": 2.5,
      },
    });

    map.addLayer({
      id: `${sourceId}-label`,
      type: "symbol",
      source: sourceId,
      layout: {
        "text-field": `${f.name}\n${Number(f.acreage).toFixed(0)} ac`,
        "text-size": 11,
        "text-anchor": "center",
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "rgba(0,0,0,0.7)",
        "text-halo-width": 1.5,
      },
    });
  });
}

export function FieldMap({ field, fields, className, aspectRatio = "16/10", showControls = true, overlay, satelliteDefault = true }: FieldMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [isSatellite, setIsSatellite] = useState(satelliteDefault);
  const [loaded, setLoaded] = useState(false);
  const fieldsRef = useRef<FieldData[]>([]);

  const allFields = fields || (field ? [field] : []);
  fieldsRef.current = allFields;

  const center = allFields.length > 0 && allFields[0].centroid_lat
    ? { lat: Number(allFields[0].centroid_lat), lng: Number(allFields[0].centroid_lng) }
    : { lat: 41.45, lng: -96.15 };

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: isSatellite ? SATELLITE_STYLE : STREET_STYLE,
      center: [center.lng, center.lat],
      zoom: allFields.length > 1 ? 12 : 14,
      attributionControl: false,
    });

    map.on("load", () => {
      setLoaded(true);
      addFieldLayers(map, fieldsRef.current);

      // Fit to all field geometries
      const bounds = new maplibregl.LngLatBounds();
      let hasBounds = false;
      fieldsRef.current.forEach(f => {
        const feat = getFieldGeometry(f);
        if (feat) {
          const coords = feat.geometry.coordinates[0];
          coords.forEach(c => bounds.extend(c as [number, number]));
          hasBounds = true;
        }
      });
      if (hasBounds) {
        map.fitBounds(bounds, { padding: 50, maxZoom: 16 });
      }
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  const toggleStyle = () => {
    const map = mapRef.current;
    if (!map) return;
    const newSat = !isSatellite;
    setIsSatellite(newSat);
    map.setStyle(newSat ? SATELLITE_STYLE : STREET_STYLE);
    map.once("style.load", () => {
      addFieldLayers(map, fieldsRef.current);
    });
  };

  return (
    <div className={cn("relative rounded-lg overflow-hidden border bg-muted", className)} style={{ aspectRatio }}>
      <div ref={mapContainer} className="absolute inset-0" />

      {showControls && (
        <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
          <button
            onClick={toggleStyle}
            className="h-7 w-7 rounded bg-card/90 backdrop-blur-sm shadow-card flex items-center justify-center text-xs text-foreground hover:bg-card transition-colors active:scale-95"
            title={isSatellite ? "Street view" : "Satellite view"}
          >
            <Layers size={14} />
          </button>
        </div>
      )}

      {center && loaded && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded bg-card/90 backdrop-blur-sm px-2 py-1 text-[10px] font-mono text-muted-foreground z-10">
          <MapIcon size={10} />
          {center.lat.toFixed(4)}°N, {Math.abs(center.lng).toFixed(4)}°W
        </div>
      )}

      {overlay && (
        <div className="absolute inset-0 z-10">{overlay}</div>
      )}
    </div>
  );
}
