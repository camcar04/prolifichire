import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { FieldMap } from "@/components/map/FieldMap";
import { DetailSkeleton } from "@/components/shared/PageSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useJob } from "@/hooks/useJobs";
import {
  formatCurrency, formatAcres, formatOperationType, formatDate,
  formatPricingModel, formatCropType,
} from "@/lib/format";
import {
  ChevronRight, Calendar, DollarSign, User, MapPin, AlertTriangle,
  Clock, FileText, Truck, CheckCircle2, Package,
} from "lucide-react";

export default function JobDetail() {
  const { jobId } = useParams();
  const { activeMode } = useAuth();
  const { data: job, isLoading } = useJob(jobId);

  if (isLoading) {
    return <AppShell title=""><DetailSkeleton /></AppShell>;
  }

  if (!job) {
    return (
      <AppShell title="">
        <EmptyState
          icon={<FileText size={24} />}
          title="Job not found"
          description="This job may have been removed or you don't have permission to view it."
          action={{ label: "Back to Jobs", to: "/jobs" }}
        />
      </AppShell>
    );
  }

  const jf = (job as any).job_fields?.[0];
  const fieldData = jf?.fields;
  const exceptions = (job as any).job_exceptions || [];
  const packets = (job as any).field_packets || [];
  const inputs = (job as any).job_inputs || [];
  const invoices = (job as any).invoices || [];

  return (
    <AppShell title="">
      <div className="animate-fade-in">
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <Link to="/jobs" className="hover:text-foreground transition-colors">Jobs</Link>
          <ChevronRight size={14} />
          <span className="text-foreground font-medium">{job.display_id}</span>
        </div>

        {/* Header */}
        <div className="rounded-xl bg-card shadow-card p-5 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold">{job.title}</h2>
                <StatusBadge status={job.status} />
                {job.urgency !== "normal" && (
                  <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full uppercase">{job.urgency}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{job.display_id} · {formatOperationType(job.operation_type)} · {formatAcres(Number(job.total_acres))}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {activeMode === "grower" && job.proof_submitted && !job.proof_approved && <Button size="sm">Approve Completion</Button>}
              {activeMode === "operator" && !job.proof_submitted && ["in_progress", "completed"].includes(job.status) && <Button size="sm">Submit Proof of Work</Button>}
              {activeMode === "operator" && job.status === "requested" && <Button size="sm">Submit Quote</Button>}
              {activeMode === "operator" && job.status === "scheduled" && <Button size="sm" variant="outline">Start Job</Button>}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Map */}
            {fieldData && fieldData.centroid_lat && (
              <div className="rounded-xl bg-card shadow-card overflow-hidden">
                <FieldMap
                  field={{
                    id: jf.field_id,
                    name: fieldData.name,
                    farmId: "",
                    county: "",
                    state: "",
                    cropYear: 2026,
                    centroid: { lat: Number(fieldData.centroid_lat), lng: Number(fieldData.centroid_lng) },
                    acreage: Number(fieldData.acreage),
                    crop: fieldData.crop,
                    status: "active",
                    createdAt: "",
                    updatedAt: "",
                  }}
                  aspectRatio="21/9"
                />
              </div>
            )}

            {/* Details grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-card shadow-card p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Calendar size={15} /> Schedule</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Deadline</span><span className="font-medium">{formatDate(job.deadline)}</span></div>
                  {job.scheduled_start && <div className="flex justify-between"><span className="text-muted-foreground">Scheduled</span><span className="font-medium">{formatDate(job.scheduled_start)} – {formatDate(job.scheduled_end!)}</span></div>}
                  {job.actual_start && <div className="flex justify-between"><span className="text-muted-foreground">Started</span><span className="font-medium">{formatDate(job.actual_start)}</span></div>}
                </div>
              </div>

              <div className="rounded-xl bg-card shadow-card p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><DollarSign size={15} /> Pricing</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Model</span><span className="font-medium">{formatPricingModel(job.pricing_model)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span className="font-medium tabular">{formatCurrency(Number(job.base_rate))}</span></div>
                  <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Estimated</span><span className="font-bold tabular">{formatCurrency(Number(job.estimated_total))}</span></div>
                  {job.approved_total && <div className="flex justify-between"><span className="text-muted-foreground">Approved</span><span className="font-medium tabular text-success">{formatCurrency(Number(job.approved_total))}</span></div>}
                </div>
              </div>
            </div>

            {/* Fields */}
            {(job as any).job_fields?.length > 0 && (
              <div className="rounded-xl bg-card shadow-card">
                <div className="p-4 border-b"><h3 className="font-semibold text-sm">Fields ({(job as any).job_fields.length})</h3></div>
                <div className="divide-y">
                  {(job as any).job_fields.map((jf: any) => (
                    <Link key={jf.id} to={`/fields/${jf.field_id}`} className="flex items-center justify-between p-4 hover:bg-surface-2 transition-colors">
                      <div><p className="text-sm font-medium">{jf.fields?.name}</p><p className="text-xs text-muted-foreground">{formatCropType(jf.crop)} · {formatAcres(Number(jf.acreage))}</p></div>
                      <StatusBadge status={jf.status === "completed" ? "completed" : jf.status === "in_progress" ? "in_progress" : "scheduled"} />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Materials */}
            {inputs.length > 0 && (
              <div className="rounded-xl bg-card shadow-card">
                <div className="p-4 border-b"><h3 className="font-semibold text-sm flex items-center gap-2"><Package size={14} /> Materials ({inputs.length})</h3></div>
                <div className="divide-y">
                  {inputs.map((input: any) => (
                    <div key={input.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{input.product_name}</p>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${input.supplied_by === "operator" ? "bg-primary/8 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                          {input.supplied_by === "operator" ? "Operator supplies" : "Grower supplies"}
                        </span>
                      </div>
                      {input.brand && <p className="text-xs text-muted-foreground mt-0.5">{input.brand}{input.variant ? ` · ${input.variant}` : ""}</p>}
                      {input.pickup_required && (
                        <p className="text-xs text-info mt-1 flex items-center gap-1"><Truck size={11} /> Pickup at {input.pickup_location_name || input.pickup_city}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exceptions */}
            {exceptions.length > 0 && (
              <div className="rounded-xl bg-card shadow-card">
                <div className="p-4 border-b"><h3 className="font-semibold text-sm flex items-center gap-2"><AlertTriangle size={14} className="text-destructive" /> Exceptions ({exceptions.length})</h3></div>
                <div className="divide-y">
                  {exceptions.map((exc: any) => (
                    <div key={exc.id} className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={exc.status === "resolved" ? "completed" : "requested"} />
                        <span className="text-xs font-medium uppercase text-muted-foreground">{exc.type.replace("_", " ")}</span>
                      </div>
                      <p className="text-sm">{exc.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(exc.created_at)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Proof of work */}
            <div className="rounded-xl bg-card shadow-card p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><CheckCircle2 size={15} /> Proof of Work</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Submitted</span>{job.proof_submitted ? <span className="text-success font-medium">Yes</span> : <span className="text-muted-foreground">Pending</span>}</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Approved</span>{job.proof_approved ? <span className="text-success font-medium">Yes</span> : <span className="text-muted-foreground">Pending</span>}</div>
              </div>
            </div>

            {/* Invoices */}
            {invoices.length > 0 && (
              <div className="rounded-xl bg-card shadow-card p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><FileText size={15} /> Invoices</h3>
                <div className="space-y-2">
                  {invoices.map((inv: any) => (
                    <div key={inv.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{inv.display_id}</span>
                      <div className="flex items-center gap-2">
                        <span className="tabular">{formatCurrency(Number(inv.total))}</span>
                        <StatusBadge status={inv.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Field Packets */}
            {packets.length > 0 && (
              <div className="rounded-xl bg-card shadow-card p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Package size={15} /> Field Packets</h3>
                <div className="space-y-2">
                  {packets.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between text-sm bg-surface-2 rounded-lg p-2.5">
                      <div>
                        <p className="font-medium">v{p.version}</p>
                        <p className="text-xs text-muted-foreground">{p.field_packet_files?.length || 0} files</p>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timing */}
            <div className="rounded-xl bg-card shadow-card p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Clock size={15} /> Timeline</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="font-medium">{formatDate(job.created_at)}</span></div>
                {job.scheduled_start && <div className="flex justify-between"><span className="text-muted-foreground">Scheduled</span><span className="font-medium">{formatDate(job.scheduled_start)}</span></div>}
                {job.actual_start && <div className="flex justify-between"><span className="text-muted-foreground">Started</span><span className="font-medium">{formatDate(job.actual_start)}</span></div>}
                {job.actual_end && <div className="flex justify-between"><span className="text-muted-foreground">Completed</span><span className="font-medium">{formatDate(job.actual_end)}</span></div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
