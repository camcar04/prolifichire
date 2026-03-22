import { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Crosshair, Layers } from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

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

interface FarmFieldMapProps {
  fields: FieldData[];
  selectedFieldId?: string | null;
  onFieldSelect?: (field: FieldData) => void;
  userLocation?: { lat: number; lng: number } | null;
  className?: string;
  aspectRatio?: string;
  onLocateMe?: () => void;
  locating?: boolean;
}

const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    "esri-sat": {
      type: "raster",
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      attribution: "Esri, Maxar, Earthstar Geographics",
    },
  },
  layers: [{ id: "satellite", type: "raster", source: "esri-sat", minzoom: 0, maxzoom: 19 }],
};

const STREET_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

function getFieldGeometry(f: FieldData): GeoJSON.Feature<GeoJSON.Polygon> | null {
  if (f.boundary_geojson?.coordinates?.length) {
    return {
      type: "Feature",
      properties: { id: f.id, name: f.name, acreage: f.acreage, status: f.status },
      geometry: f.boundary_geojson,
    };
  }
  if (f.bbox_north && f.bbox_south && f.bbox_east && f.bbox_west) {
    return {
      type: "Feature",
      properties: { id: f.id, name: f.name, acreage: f.acreage, status: f.status },
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

export function FarmFieldMap({
  fields, selectedFieldId, onFieldSelect, userLocation,
  className, aspectRatio = "16/10", onLocateMe, locating,
}: FarmFieldMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [isSatellite, setIsSatellite] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;

  // Compute center from fields or fallback
  const center = fields.length > 0 && fields[0].centroid_lat
    ? { lat: Number(fields[0].centroid_lat), lng: Number(fields[0].centroid_lng) }
    : userLocation || { lat: 41.45, lng: -96.15 };

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: SATELLITE_STYLE,
      center: [center.lng, center.lat],
      zoom: fields.length > 1 ? 12 : 14,
      attributionControl: false,
    });

    map.on("load", () => {
      setLoaded(true);
      addFieldsSource(map);
      fitToFields(map);

      // Click handler for field selection
      map.on("click", "fields-fill", (e) => {
        if (e.features?.[0]?.properties?.id && onFieldSelect) {
          const clickedId = e.features[0].properties.id;
          const field = fieldsRef.current.find(f => f.id === clickedId);
          if (field) onFieldSelect(field);
        }
      });

      map.on("mouseenter", "fields-fill", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "fields-fill", () => { map.getCanvas().style.cursor = ""; });
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Update fields data when fields change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    updateFieldsData(map);
    fitToFields(map);
  }, [fields, loaded]);

  // Update selection highlight
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    try {
      map.setPaintProperty("fields-fill", "fill-opacity", [
        "case",
        ["==", ["get", "id"], selectedFieldId || ""],
        0.4,
        0.2,
      ]);
      map.setPaintProperty("fields-outline", "line-width", [
        "case",
        ["==", ["get", "id"], selectedFieldId || ""],
        4,
        2,
      ]);
    } catch { /* layers not yet ready */ }
  }, [selectedFieldId, loaded]);

  // User location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    if (userLocation) {
      if (!userMarkerRef.current) {
        const el = document.createElement("div");
        el.className = "w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg";
        el.style.boxShadow = "0 0 0 6px rgba(59,130,246,0.2), 0 2px 8px rgba(0,0,0,0.3)";
        userMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([userLocation.lng, userLocation.lat])
          .addTo(map);
      } else {
        userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
      }
    }
  }, [userLocation, loaded]);

  function addFieldsSource(map: maplibregl.Map) {
    const features = fields.map(getFieldGeometry).filter(Boolean) as GeoJSON.Feature[];
    const fc: GeoJSON.FeatureCollection = { type: "FeatureCollection", features };

    map.addSource("farm-fields", { type: "geojson", data: fc });

    map.addLayer({
      id: "fields-fill", type: "fill", source: "farm-fields",
      paint: { "fill-color": "hsl(152, 50%, 40%)", "fill-opacity": 0.2 },
    });
    map.addLayer({
      id: "fields-outline", type: "line", source: "farm-fields",
      paint: { "line-color": "hsl(152, 65%, 55%)", "line-width": 2 },
    });
    map.addLayer({
      id: "fields-label", type: "symbol", source: "farm-fields",
      layout: {
        "text-field": ["concat", ["get", "name"], "\n", ["to-string", ["get", "acreage"]], " ac"],
        "text-size": 12,
        "text-anchor": "center",
        "text-allow-overlap": true,
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "rgba(0,0,0,0.75)",
        "text-halo-width": 1.5,
      },
    });
  }

  function updateFieldsData(map: maplibregl.Map) {
    const src = map.getSource("farm-fields") as maplibregl.GeoJSONSource;
    if (!src) return;
    const features = fields.map(getFieldGeometry).filter(Boolean) as GeoJSON.Feature[];
    src.setData({ type: "FeatureCollection", features });
  }

  function fitToFields(map: maplibregl.Map) {
    const bounds = new maplibregl.LngLatBounds();
    let hasBounds = false;
    fields.forEach(f => {
      const feat = getFieldGeometry(f);
      if (feat) {
        feat.geometry.coordinates[0].forEach(c => bounds.extend(c as [number, number]));
        hasBounds = true;
      }
    });
    if (hasBounds) map.fitBounds(bounds, { padding: 60, maxZoom: 16 });
  }

  const toggleStyle = () => {
    const map = mapRef.current;
    if (!map) return;
    const newSat = !isSatellite;
    setIsSatellite(newSat);
    map.setStyle(newSat ? SATELLITE_STYLE : STREET_STYLE);
    map.once("style.load", () => {
      addFieldsSource(map);
      if (selectedFieldId) {
        map.setPaintProperty("fields-fill", "fill-opacity", [
          "case", ["==", ["get", "id"], selectedFieldId], 0.4, 0.2,
        ]);
      }
    });
  };

  return (
    <div className={cn("relative rounded-lg overflow-hidden border bg-muted", className)} style={{ aspectRatio }}>
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
        <button
          onClick={toggleStyle}
          className="h-8 w-8 rounded-lg bg-card/90 backdrop-blur-sm shadow-md flex items-center justify-center text-foreground hover:bg-card transition-colors active:scale-95"
          title={isSatellite ? "Street view" : "Satellite view"}
        >
          <Layers size={14} />
        </button>
        {onLocateMe && (
          <button
            onClick={onLocateMe}
            disabled={locating}
            className={cn(
              "h-8 w-8 rounded-lg bg-card/90 backdrop-blur-sm shadow-md flex items-center justify-center text-foreground hover:bg-card transition-colors active:scale-95",
              locating && "animate-pulse"
            )}
            title="Use my location"
          >
            <Crosshair size={14} />
          </button>
        )}
      </div>

      {/* Field count */}
      {loaded && fields.length > 0 && (
        <div className="absolute bottom-2 left-2 rounded-lg bg-card/90 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-foreground z-10">
          {fields.length} field{fields.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
