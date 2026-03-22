import { cn } from "@/lib/utils";
import { Map } from "lucide-react";
import type { Field } from "@/types/domain";

interface FieldMapProps {
  field?: Field;
  fields?: Field[];
  className?: string;
  aspectRatio?: string;
  showControls?: boolean;
  overlay?: React.ReactNode;
}

export function FieldMap({ field, fields, className, aspectRatio = "16/10", showControls = true, overlay }: FieldMapProps) {
  const allFields = fields || (field ? [field] : []);
  const center = allFields.length > 0 ? allFields[0].centroid : null;

  return (
    <div className={cn("relative rounded-lg overflow-hidden bg-[#e8e4d8] border", className)} style={{ aspectRatio }}>
      {/* Simulated map tiles */}
      <div className="absolute inset-0">
        <svg viewBox="0 0 800 500" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          {/* Base terrain */}
          <rect width="800" height="500" fill="hsl(40, 20%, 88%)" />
          {/* Simulated field polygons */}
          {allFields.map((f, i) => {
            const cx = 200 + (i % 3) * 200;
            const cy = 150 + Math.floor(i / 3) * 150;
            const w = 80 + (f.acreage / 4);
            const h = 60 + (f.acreage / 5);
            return (
              <g key={f.id}>
                <rect
                  x={cx - w / 2} y={cy - h / 2} width={w} height={h}
                  fill={f.status === "active" ? "hsl(120, 35%, 62%)" : "hsl(80, 30%, 68%)"}
                  stroke="hsl(152, 38%, 22%)"
                  strokeWidth="2"
                  rx="2"
                  opacity={0.7}
                />
                {/* Crop rows suggestion */}
                {Array.from({ length: Math.floor(w / 8) }).map((_, ri) => (
                  <line
                    key={ri}
                    x1={cx - w / 2 + ri * 8 + 4} y1={cy - h / 2 + 2}
                    x2={cx - w / 2 + ri * 8 + 4} y2={cy + h / 2 - 2}
                    stroke="hsl(120, 25%, 50%)" strokeWidth="0.5" opacity="0.3"
                  />
                ))}
                <text x={cx} y={cy + 4} textAnchor="middle" fontSize="9" fill="hsl(152, 38%, 15%)" fontWeight="600">
                  {f.name.split("—")[0].trim()}
                </text>
                <text x={cx} y={cy + 16} textAnchor="middle" fontSize="7" fill="hsl(152, 38%, 30%)">
                  {f.acreage} ac
                </text>
              </g>
            );
          })}
          {/* Roads */}
          <line x1="0" y1="400" x2="800" y2="400" stroke="hsl(30, 10%, 70%)" strokeWidth="3" strokeDasharray="12,6" />
          <line x1="600" y1="0" x2="600" y2="500" stroke="hsl(30, 10%, 70%)" strokeWidth="2" strokeDasharray="8,4" />
          {/* Section labels */}
          <text x="20" y="490" fontSize="8" fill="hsl(30, 10%, 55%)">County Road 12</text>
          <text x="608" y="20" fontSize="8" fill="hsl(30, 10%, 55%)" writingMode="vertical-rl" textAnchor="start">Hwy 15</text>
        </svg>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          <button className="h-7 w-7 rounded bg-card/90 backdrop-blur-sm shadow-card flex items-center justify-center text-xs font-bold text-foreground hover:bg-card transition-colors">+</button>
          <button className="h-7 w-7 rounded bg-card/90 backdrop-blur-sm shadow-card flex items-center justify-center text-xs font-bold text-foreground hover:bg-card transition-colors">−</button>
        </div>
      )}

      {/* Coordinate display */}
      {center && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded bg-card/90 backdrop-blur-sm px-2 py-1 text-[10px] font-mono text-muted-foreground">
          <Map size={10} />
          {center.lat.toFixed(4)}°N, {Math.abs(center.lng).toFixed(4)}°W
        </div>
      )}

      {/* Overlay */}
      {overlay && (
        <div className="absolute inset-0">
          {overlay}
        </div>
      )}
    </div>
  );
}
