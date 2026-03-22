import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Map, Plus, ArrowRight } from "lucide-react";

const fields = [
  { id: "north-80", name: "North 80 — Section 14", acres: 78.4, crop: "Corn", year: 2026, jobs: 1, status: "Active" },
  { id: "river-bottom", name: "River Bottom — East", acres: 124.2, crop: "Soybeans", year: 2026, jobs: 0, status: "Idle" },
  { id: "hilltop", name: "Hilltop Quarter", acres: 156.8, crop: "Corn", year: 2026, jobs: 1, status: "Active" },
  { id: "county-line", name: "County Line Strip", acres: 42.1, crop: "Wheat", year: 2026, jobs: 0, status: "Idle" },
  { id: "west-bottoms", name: "West Bottoms", acres: 89.6, crop: "Soybeans", year: 2026, jobs: 0, status: "Idle" },
];

export default function FieldsPage() {
  return (
    <AppShell title="Fields">
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">{fields.length} fields · {fields.reduce((a, f) => a + f.acres, 0).toFixed(1)} total acres</p>
          <Button size="sm"><Plus size={14} /> Add Field</Button>
        </div>

        {/* Map placeholder */}
        <div className="rounded-xl bg-card shadow-card mb-6 overflow-hidden">
          <div className="aspect-[21/9] bg-surface-3 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Map size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">All Fields Map</p>
              <p className="text-xs">Connect a map provider to view all field boundaries</p>
            </div>
          </div>
        </div>

        {/* Fields list */}
        <div className="rounded-xl bg-card shadow-card divide-y">
          {fields.map((field) => (
            <Link
              key={field.id}
              to={`/fields/${field.id}`}
              className="flex items-center justify-between p-4 hover:bg-surface-2 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/8 flex items-center justify-center">
                  <Map size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{field.name}</p>
                  <p className="text-xs text-muted-foreground">{field.crop} · {field.year} · {field.acres} ac</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs font-medium ${field.status === "Active" ? "text-success" : "text-muted-foreground"}`}>
                  {field.status}
                </span>
                <span className="text-xs text-muted-foreground tabular">{field.jobs} active job{field.jobs !== 1 ? "s" : ""}</span>
                <ArrowRight size={16} className="text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
