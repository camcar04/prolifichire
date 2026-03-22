import { Link } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { StatusBadge, type Status } from "@/components/ui/status-badge";
import { MapPin, Clock, DollarSign, ArrowRight } from "lucide-react";

const listings = [
  {
    id: "1",
    title: "Spring Herbicide Application",
    field: "North 80 — Section 14",
    location: "Washington County, NE",
    crop: "Corn",
    acres: 78.4,
    rate: "$40.00/ac",
    deadline: "Mar 18, 2026",
    status: "requested" as Status,
    type: "Spraying",
  },
  {
    id: "2",
    title: "Cover Crop Seeding",
    field: "River Bottom — East",
    location: "Dodge County, NE",
    crop: "Soybeans (post-harvest)",
    acres: 124.2,
    rate: "$22.00/ac",
    deadline: "Nov 1, 2025",
    status: "requested" as Status,
    type: "Planting",
  },
  {
    id: "3",
    title: "Fall Tillage — Chisel Plow",
    field: "Hilltop Quarter",
    location: "Saunders County, NE",
    crop: "Corn",
    acres: 156.8,
    rate: "$28.00/ac",
    deadline: "Nov 15, 2025",
    status: "quoted" as Status,
    type: "Tillage",
  },
  {
    id: "4",
    title: "Grain Hauling — Corn",
    field: "West Bottoms",
    location: "Butler County, NE",
    crop: "Corn",
    acres: 89.6,
    rate: "Flat rate: $1,200",
    deadline: "Oct 20, 2025",
    status: "requested" as Status,
    type: "Hauling",
  },
];

export default function Marketplace() {
  return (
    <AppShell title="Marketplace">
      <div className="animate-fade-in">
        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {["All", "Spraying", "Planting", "Harvest", "Tillage", "Hauling"].map((f, i) => (
            <button
              key={f}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                i === 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Listings */}
        <div className="grid md:grid-cols-2 gap-4">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="rounded-xl bg-card shadow-card hover:shadow-card-hover transition-[box-shadow] duration-300 p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="inline-block text-xs font-medium text-primary bg-primary/8 rounded-full px-2 py-0.5 mb-2">
                    {listing.type}
                  </span>
                  <h3 className="font-semibold">{listing.title}</h3>
                  <p className="text-sm text-muted-foreground">{listing.field}</p>
                </div>
                <StatusBadge status={listing.status} />
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin size={13} />
                  <span>{listing.location}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock size={13} />
                  <span>by {listing.deadline}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <DollarSign size={13} />
                  <span>{listing.rate}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-sm tabular font-medium">{listing.acres} acres · {listing.crop}</span>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/fields/north-80">
                    View Details <ArrowRight size={14} />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
