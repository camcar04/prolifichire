import { useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { StatusBadge, type Status } from "@/components/ui/status-badge";
import {
  Map, FileText, DollarSign, MessageSquare, Shield, Clock,
  ChevronRight, Download, Layers, User, Calendar, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Demo field data
const field = {
  name: "North 80 — Section 14",
  acreage: 78.4,
  crop: "Corn",
  cropYear: 2026,
  status: "in_progress" as Status,
  operator: "AgriPro Services",
  travelDistance: "14.2 mi",
  eta: "22 min",
  centroid: { lat: 41.2565, lng: -95.9345 },
};

const tabs = [
  { id: "overview", label: "Overview", icon: Layers },
  { id: "jobs", label: "Jobs", icon: FileText },
  { id: "history", label: "History", icon: Clock },
  { id: "files", label: "Files & Maps", icon: Map },
  { id: "financials", label: "Financials", icon: DollarSign },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "permissions", label: "Permissions", icon: Shield },
];

const jobHistory = [
  { date: "Mar 12, 2026", type: "Spraying", operator: "AgriPro Services", status: "in_progress" as Status, amount: "$3,136" },
  { date: "Oct 28, 2025", type: "Harvest", operator: "Prairie Partners", status: "paid" as Status, amount: "$5,488" },
  { date: "May 14, 2025", type: "Planting", operator: "Heartland Custom", status: "paid" as Status, amount: "$2,744" },
  { date: "Apr 2, 2025", type: "Spraying", operator: "AgriPro Services", status: "paid" as Status, amount: "$1,960" },
];

const files = [
  { name: "north-80-boundary.geojson", type: "GeoJSON", size: "24 KB", date: "Jan 15, 2026" },
  { name: "spring-rx-map.zip", type: "Shapefile", size: "1.2 MB", date: "Mar 1, 2026" },
  { name: "soil-sample-results.csv", type: "CSV", size: "48 KB", date: "Feb 20, 2026" },
  { name: "planting-plan-2026.pdf", type: "PDF", size: "380 KB", date: "Apr 1, 2026" },
];

export default function FieldWorkspace() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <AppShell title="">
      <div className="animate-fade-in">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <Link to="/fields" className="hover:text-foreground transition-colors">Fields</Link>
          <ChevronRight size={14} />
          <span className="text-foreground font-medium">{field.name}</span>
        </div>

        {/* Top Section — Map + Field Info */}
        <div className="grid lg:grid-cols-5 gap-6 mb-6">
          {/* Map */}
          <div className="lg:col-span-3 rounded-xl bg-card shadow-card overflow-hidden">
            <div className="aspect-[16/10] bg-surface-3 flex items-center justify-center relative">
              <div className="text-center text-muted-foreground">
                <Map size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Field Boundary Map</p>
                <p className="text-xs">Connect MapLibre or Mapbox to render boundaries</p>
              </div>
              {/* Status overlay */}
              <div className="absolute top-3 left-3">
                <StatusBadge status={field.status} />
              </div>
            </div>
          </div>

          {/* Field Info */}
          <div className="lg:col-span-2 rounded-xl bg-card shadow-card p-5 flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold">{field.name}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{field.crop} · {field.cropYear}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InfoBlock label="Acreage" value={`${field.acreage} ac`} />
              <InfoBlock label="Status" value={<StatusBadge status={field.status} />} />
              <InfoBlock label="Operator" value={field.operator} icon={<User size={14} />} />
              <InfoBlock label="Travel / ETA" value={`${field.travelDistance} · ${field.eta}`} />
            </div>

            <div className="mt-auto pt-3 border-t flex gap-2">
              <Button size="sm" className="flex-1">
                <FileText size={14} /> View Field Packet
              </Button>
              <Button variant="outline" size="sm">
                <Download size={14} />
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b mb-6">
          <div className="flex gap-0 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "jobs" && <JobsTab />}
        {activeTab === "files" && <FilesTab />}
        {activeTab === "history" && <HistoryTab />}
        {activeTab === "financials" && <FinancialsTab />}
        {activeTab === "messages" && <EmptyTab label="Messages" desc="No messages for this field yet." />}
        {activeTab === "permissions" && <EmptyTab label="Permissions" desc="Configure who can access, order, and approve work on this field." />}
      </div>
    </AppShell>
  );
}

function InfoBlock({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-surface-2 p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-1.5 text-sm font-medium">
        {icon}
        {typeof value === "string" ? <span>{value}</span> : value}
      </div>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="rounded-xl bg-card shadow-card p-5">
        <h3 className="font-semibold mb-4">Active Job</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Job</span>
            <span className="font-medium">JOB-1847 · Spraying</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Operator</span>
            <span className="font-medium">AgriPro Services</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Scheduled</span>
            <span className="font-medium">Mar 12–14, 2026</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Rate</span>
            <span className="font-medium tabular">$40.00/ac</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estimated Total</span>
            <span className="font-bold tabular">$3,136.00</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-card shadow-card p-5">
        <h3 className="font-semibold mb-4">Alerts</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg bg-warning/8 p-3">
            <AlertTriangle size={16} className="text-warning mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Weather Advisory</p>
              <p className="text-xs text-muted-foreground">Rain expected Mar 13. Spray window may shift.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-info/8 p-3">
            <Calendar size={16} className="text-info mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Field Packet Ready</p>
              <p className="text-xs text-muted-foreground">Boundary, Rx map, and access notes are ready for download.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="md:col-span-2 rounded-xl bg-card shadow-card p-5">
        <h3 className="font-semibold mb-4">Season Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-surface-2">
            <p className="text-2xl font-bold tabular">4</p>
            <p className="text-xs text-muted-foreground mt-1">Jobs this season</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-surface-2">
            <p className="text-2xl font-bold tabular">$13,328</p>
            <p className="text-xs text-muted-foreground mt-1">Total spend</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-surface-2">
            <p className="text-2xl font-bold tabular">3</p>
            <p className="text-xs text-muted-foreground mt-1">Operators used</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-surface-2">
            <p className="text-2xl font-bold tabular">12</p>
            <p className="text-xs text-muted-foreground mt-1">Files uploaded</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function JobsTab() {
  return (
    <div className="rounded-xl bg-card shadow-card">
      <div className="flex items-center justify-between p-5 border-b">
        <h3 className="font-semibold">Job History</h3>
        <Button size="sm"><FileText size={14} /> Create Job</Button>
      </div>
      <div className="divide-y">
        {jobHistory.map((job, i) => (
          <div key={i} className="flex items-center justify-between p-4 hover:bg-surface-2 transition-colors">
            <div>
              <p className="text-sm font-medium">{job.type}</p>
              <p className="text-xs text-muted-foreground">{job.operator} · {job.date}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium tabular">{job.amount}</span>
              <StatusBadge status={job.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilesTab() {
  return (
    <div className="rounded-xl bg-card shadow-card">
      <div className="flex items-center justify-between p-5 border-b">
        <h3 className="font-semibold">Files & Maps</h3>
        <Button variant="outline" size="sm">Upload File</Button>
      </div>
      <div className="divide-y">
        {files.map((file, i) => (
          <div key={i} className="flex items-center justify-between p-4 hover:bg-surface-2 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/8 flex items-center justify-center">
                <FileText size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{file.type} · {file.size} · {file.date}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <Download size={16} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryTab() {
  return (
    <div className="rounded-xl bg-card shadow-card p-5">
      <h3 className="font-semibold mb-4">Field Timeline</h3>
      <div className="space-y-0">
        {[
          { date: "Mar 12, 2026", event: "Spray job started by AgriPro Services", type: "job" },
          { date: "Mar 10, 2026", event: "Field packet generated for JOB-1847", type: "system" },
          { date: "Mar 8, 2026", event: "Spray job accepted by AgriPro Services", type: "job" },
          { date: "Mar 5, 2026", event: "Rx map uploaded: spring-rx-map.zip", type: "file" },
          { date: "Oct 28, 2025", event: "Harvest completed. 78.4 ac. Yield: 213 bu/ac", type: "job" },
          { date: "Oct 15, 2025", event: "Harvest job started by Prairie Partners", type: "job" },
        ].map((item, i) => (
          <div key={i} className="flex gap-4 pb-6 relative">
            {i < 5 && <div className="absolute left-[7px] top-6 bottom-0 w-px bg-border" />}
            <div className="h-4 w-4 rounded-full bg-primary/15 border-2 border-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm">{item.event}</p>
              <p className="text-xs text-muted-foreground">{item.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FinancialsTab() {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-card shadow-card p-5 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Quoted</p>
          <p className="text-2xl font-bold tabular mt-1">$14,928</p>
        </div>
        <div className="rounded-xl bg-card shadow-card p-5 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Paid</p>
          <p className="text-2xl font-bold tabular mt-1 text-success">$10,192</p>
        </div>
        <div className="rounded-xl bg-card shadow-card p-5 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Outstanding</p>
          <p className="text-2xl font-bold tabular mt-1 text-warning">$4,736</p>
        </div>
      </div>
      <div className="rounded-xl bg-card shadow-card">
        <div className="p-5 border-b">
          <h3 className="font-semibold">Invoices</h3>
        </div>
        <div className="divide-y">
          {[
            { id: "INV-3021", job: "Spraying", amount: "$3,136.00", status: "invoiced" as Status, date: "Mar 14, 2026" },
            { id: "INV-2984", job: "Harvest", amount: "$5,488.00", status: "paid" as Status, date: "Nov 2, 2025" },
            { id: "INV-2901", job: "Planting", amount: "$2,744.00", status: "paid" as Status, date: "May 20, 2025" },
          ].map((inv) => (
            <div key={inv.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">{inv.id} · {inv.job}</p>
                <p className="text-xs text-muted-foreground">{inv.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold tabular">{inv.amount}</span>
                <StatusBadge status={inv.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyTab({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="rounded-xl bg-card shadow-card p-12 text-center">
      <Shield size={32} className="mx-auto mb-3 text-muted-foreground/30" />
      <h3 className="font-semibold mb-1">{label}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">{desc}</p>
      <Button variant="outline" size="sm" className="mt-4">Configure</Button>
    </div>
  );
}
