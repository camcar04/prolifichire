import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { FieldMap } from "@/components/map/FieldMap";
import { WeatherPanel } from "@/components/weather/WeatherPanel";
import { EmptyState } from "@/components/shared/EmptyState";
import { DetailSkeleton } from "@/components/shared/PageSkeleton";
import { FieldFileUpload } from "@/components/fields/FieldFileUpload";
import { useField } from "@/hooks/useFields";
import { useJobsByField } from "@/hooks/useJobs";
import { useDatasetsByField, useInvoicesByField } from "@/hooks/useDatasets";
import { supabase } from "@/integrations/supabase/client";
import {
  formatCurrency, formatAcres, formatOperationType, formatCropType,
  formatDate, formatPricingModel, formatFileSize, formatRelative,
} from "@/lib/format";
import {
  ChevronRight, Download, Layers, Calendar, AlertTriangle,
  FileText, DollarSign, MessageSquare, Shield, Clock, Map as MapIcon,
  Upload, Plus, Package, User, Wheat,
} from "lucide-react";
import { cn } from "@/lib/utils";

const growerTabs = [
  { id: "overview", label: "Overview", icon: Layers },
  { id: "jobs", label: "Jobs", icon: FileText },
  { id: "files", label: "Files & Maps", icon: MapIcon },
  { id: "financials", label: "Financials", icon: DollarSign },
];

const operatorTabs = [
  { id: "overview", label: "Overview", icon: Layers },
  { id: "files", label: "Files & Packet", icon: MapIcon },
  { id: "jobs", label: "Job Details", icon: FileText },
];

export default function FieldWorkspace() {
  const { fieldId } = useParams();
  const { activeMode } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const tabs = activeMode === "operator" ? operatorTabs : growerTabs;

  const { data: field, isLoading: fieldLoading } = useField(fieldId);
  const { data: fieldJobs = [], isLoading: jobsLoading } = useJobsByField(fieldId);
  const { data: datasets = [] } = useDatasetsByField(fieldId);
  const { data: invoices = [] } = useInvoicesByField(fieldId);

  if (fieldLoading) return <AppShell title=""><DetailSkeleton /></AppShell>;
  if (!field) {
    return (
      <AppShell title="">
        <EmptyState
          icon={<Wheat size={24} />}
          title="Field not found"
          description="This field may have been removed or you don't have permission to view it."
          action={{ label: "Back to Fields", to: "/fields" }}
        />
      </AppShell>
    );
  }

  const accessInstructions = field.field_access_instructions?.[0];
  const requirements = field.field_requirements || [];
  const farmName = (field as any).farms?.name || "";
  const activeJob = fieldJobs.find((j: any) => ["in_progress", "scheduled", "accepted"].includes(j.status));

  return (
    <AppShell title="">
      <div className="animate-fade-in">
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <Link to="/fields" className="hover:text-foreground transition-colors">Fields</Link>
          <ChevronRight size={14} />
          {farmName && <><span className="hover:text-foreground">{farmName}</span><ChevronRight size={14} /></>}
          <span className="text-foreground font-medium">{field.name}</span>
        </div>

        {/* Top: Map + Info */}
        <div className="grid lg:grid-cols-5 gap-4 mb-5">
          <div className="lg:col-span-3 rounded-lg bg-card border overflow-hidden relative">
            {field.centroid_lat ? (
              <FieldMap
                field={{
                  id: field.id, name: field.name, farmId: field.farm_id,
                  county: field.county || "", state: field.state || "",
                  cropYear: field.crop_year,
                  centroid: { lat: Number(field.centroid_lat), lng: Number(field.centroid_lng) },
                  boundingBox: {
                    north: Number(field.bbox_north || field.centroid_lat),
                    south: Number(field.bbox_south || field.centroid_lat),
                    east: Number(field.bbox_east || field.centroid_lng),
                    west: Number(field.bbox_west || field.centroid_lng),
                  },
                  acreage: Number(field.acreage), crop: field.crop, status: field.status,
                  createdAt: field.created_at, updatedAt: field.updated_at,
                }}
                aspectRatio="16/10"
              />
            ) : (
              <div className="aspect-[16/10] bg-muted flex items-center justify-center text-muted-foreground text-sm">
                No location data — upload a boundary file or set coordinates
              </div>
            )}
            <div className="absolute top-3 left-3"><StatusBadge status={field.status} /></div>
          </div>

          <div className="lg:col-span-2 rounded-lg bg-card border p-4 flex flex-col gap-3">
            <div>
              <h2 className="text-lg font-bold">{field.name}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatCropType(field.crop)} · {field.crop_year}
                {field.county && ` · ${field.county} Co.`}
                {field.state && `, ${field.state}`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <InfoBlock label="Acreage" value={formatAcres(Number(field.acreage))} />
              <InfoBlock label="Status" value={<StatusBadge status={field.status} />} />
              <InfoBlock label="Jobs" value={`${fieldJobs.length} total`} />
              <InfoBlock label="Files" value={`${datasets.length} uploaded`} />
              {field.clu_number && <InfoBlock label="CLU" value={field.clu_number} />}
              {field.fsa_farm_number && <InfoBlock label="FSA Farm #" value={field.fsa_farm_number} />}
            </div>
            {field.legal_description && (
              <p className="text-xs text-muted-foreground border-t pt-2">{field.legal_description}</p>
            )}
          </div>
        </div>

        {/* Requirements + Access */}
        {(requirements.length > 0 || accessInstructions) && (
          <div className="grid md:grid-cols-2 gap-4 mb-5">
            {requirements.length > 0 && (
              <div className="rounded-lg bg-card border p-4">
                <h3 className="text-sm font-semibold mb-3">Field Requirements</h3>
                <div className="space-y-2">
                  {requirements.map((r: any) => (
                    <div key={r.id} className={cn("flex items-start gap-2 rounded-lg p-2.5 text-sm",
                      r.severity === "critical" ? "bg-destructive/8" : r.severity === "warning" ? "bg-warning/8" : "bg-info/8"
                    )}>
                      <AlertTriangle size={14} className={cn("mt-0.5 shrink-0",
                        r.severity === "critical" ? "text-destructive" : r.severity === "warning" ? "text-warning" : "text-info"
                      )} />
                      <div>
                        <p className="font-medium">{r.description}</p>
                        {r.applies_to?.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Applies to: {r.applies_to.map(formatOperationType).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {accessInstructions && (
              <div className="rounded-lg bg-card border p-4">
                <h3 className="text-sm font-semibold mb-3">Access Instructions</h3>
                <p className="text-sm leading-relaxed">{accessInstructions.directions}</p>
                {accessInstructions.gate_code && <p className="text-sm mt-2"><span className="font-medium">Gate Code:</span> {accessInstructions.gate_code}</p>}
                {accessInstructions.hazards && <p className="text-sm mt-2 text-destructive"><span className="font-medium">Hazards:</span> {accessInstructions.hazards}</p>}
                {accessInstructions.notes && <p className="text-sm mt-2 text-muted-foreground">{accessInstructions.notes}</p>}
                {accessInstructions.contact_name && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Contact: {accessInstructions.contact_name}{accessInstructions.contact_phone ? ` · ${accessInstructions.contact_phone}` : ""}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b mb-5">
          <div className="flex gap-0 overflow-x-auto -mb-px">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn("flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  activeTab === tab.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}>
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === "overview" && (
          <OverviewContent
            field={field}
            activeJob={activeJob}
            jobCount={fieldJobs.length}
            fileCount={datasets.length}
          />
        )}
        {activeTab === "jobs" && <JobsContent jobs={fieldJobs} isLoading={jobsLoading} />}
        {activeTab === "files" && <FilesContent datasets={datasets} />}
        {activeMode === "grower" && activeTab === "financials" && <FinancialsContent invoices={invoices} />}
      </div>
    </AppShell>
  );
}

function InfoBlock({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rounded-md bg-muted/50 p-2.5">
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5 text-sm font-medium">
        {icon}{typeof value === "string" ? <span className="truncate">{value}</span> : value}
      </div>
    </div>
  );
}

function OverviewContent({ field, activeJob, jobCount, fileCount }: any) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {field.centroid_lat && (
        <div className="md:col-span-2">
          <WeatherPanel fieldId={field.id} lat={Number(field.centroid_lat)} lng={Number(field.centroid_lng)} operationType={activeJob?.operation_type} />
        </div>
      )}

      {activeJob && (
        <div className="rounded-lg bg-card border p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><FileText size={14} /> Active Job</h3>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between"><span className="text-muted-foreground">Job</span><span className="font-medium">{activeJob.display_id} · {formatOperationType(activeJob.operation_type)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={activeJob.status} /></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Acres</span><span className="font-medium tabular">{formatAcres(Number(activeJob.total_acres))}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span className="font-medium tabular">{formatCurrency(Number(activeJob.base_rate))}/{formatPricingModel(activeJob.pricing_model).toLowerCase().replace("per ", "")}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Estimated</span><span className="font-bold tabular">{formatCurrency(Number(activeJob.estimated_total))}</span></div>
          </div>
          <Button size="sm" variant="outline" className="w-full mt-3" asChild>
            <Link to={`/jobs/${activeJob.id}`}>View Job Details</Link>
          </Button>
        </div>
      )}

      <div className="rounded-lg bg-card border p-4">
        <h3 className="text-sm font-semibold mb-3">Field Summary</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-md bg-muted/50">
            <p className="text-xl font-bold tabular">{jobCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Jobs</p>
          </div>
          <div className="text-center p-3 rounded-md bg-muted/50">
            <p className="text-xl font-bold tabular">{fileCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Files</p>
          </div>
        </div>
      </div>

      {!activeJob && jobCount === 0 && (
        <div className="md:col-span-2">
          <EmptyState
            icon={<FileText size={24} />}
            title="No work history yet"
            description="This field has no job records. Create a job to start building this field's work history."
            action={{ label: "Create Job", to: "/jobs?new=1" }}
          />
        </div>
      )}
    </div>
  );
}

function JobsContent({ jobs, isLoading }: { jobs: any[]; isLoading: boolean }) {
  if (isLoading) return <div className="text-sm text-muted-foreground p-8 text-center">Loading jobs…</div>;

  return (
    <div className="rounded-lg bg-card border">
      <div className="flex items-center justify-between px-4 py-2.5 border-b">
        <h3 className="text-sm font-semibold">All Jobs ({jobs.length})</h3>
      </div>
      {jobs.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No jobs linked to this field yet.
        </div>
      ) : (
        <div className="divide-y">
          {jobs.map((job: any) => (
            <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
              <div>
                <p className="text-sm font-medium">{job.display_id} · {formatOperationType(job.operation_type)}</p>
                <p className="text-xs text-muted-foreground">
                  {job.scheduled_start ? formatDate(job.scheduled_start) : "Unscheduled"} · {formatAcres(Number(job.total_acres))}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-medium tabular">{formatCurrency(Number(job.estimated_total))}</span>
                <StatusBadge status={job.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FilesContent({ datasets }: { datasets: any[] }) {
  return (
    <div className="rounded-lg bg-card border">
      <div className="flex items-center justify-between px-4 py-2.5 border-b">
        <h3 className="text-sm font-semibold">Files & Maps ({datasets.length})</h3>
        <Button variant="outline" size="sm" className="h-7 text-xs"><Upload size={12} className="mr-1" /> Upload</Button>
      </div>
      {datasets.length === 0 ? (
        <div className="p-8 text-center">
          <Upload size={20} className="mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Upload boundary files, prescriptions, or other field data.</p>
        </div>
      ) : (
        <div className="divide-y">
          {datasets.map((ds: any) => (
            <div key={ds.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded bg-primary/8 flex items-center justify-center shrink-0">
                  <FileText size={14} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{ds.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ds.category} · v{ds.version} · {formatFileSize(ds.file_size)}
                    {ds.crop_year && ` · ${ds.crop_year}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">{formatRelative(ds.created_at)}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Download size={13} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FinancialsContent({ invoices }: { invoices: any[] }) {
  const totalInvoiced = invoices.reduce((a: number, i: any) => a + Number(i.total || 0), 0);
  const totalPaid = invoices.filter((i: any) => i.status === "paid").reduce((a: number, i: any) => a + Number(i.total || 0), 0);
  const outstanding = totalInvoiced - totalPaid;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-lg bg-card border p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Invoiced</p>
          <p className="text-xl font-bold tabular mt-1">{formatCurrency(totalInvoiced)}</p>
        </div>
        <div className="rounded-lg bg-card border p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Paid</p>
          <p className="text-xl font-bold tabular mt-1 text-success">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="rounded-lg bg-card border p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Outstanding</p>
          <p className="text-xl font-bold tabular mt-1 text-warning">{formatCurrency(outstanding)}</p>
        </div>
      </div>

      <div className="rounded-lg bg-card border">
        <div className="px-4 py-2.5 border-b"><h3 className="text-sm font-semibold">Invoices</h3></div>
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No invoices for this field yet.</div>
        ) : (
          <div className="divide-y">
            {invoices.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{inv.display_id}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(inv.created_at)} · Due {formatDate(inv.due_date)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-medium tabular">{formatCurrency(Number(inv.total))}</span>
                  <StatusBadge status={inv.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
