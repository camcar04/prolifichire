import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { FieldMap } from "@/components/map/FieldMap";
import { DetailSkeleton } from "@/components/shared/PageSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { JobCredentialMatch } from "@/components/operators/JobCredentialMatch";
import { QuoteComparisonTable } from "@/components/jobs/QuoteComparisonTable";
import { OperatorDecisionStrip } from "@/components/jobs/OperatorDecisionStrip";
import { JobExecutionPanel } from "@/components/jobs/JobExecutionPanel";
import { CancelJobDialog } from "@/components/jobs/CancelJobDialog";
import { formatContractMode } from "@/components/jobs/ContractModeSelector";
import { canCancelJob, canEditJob } from "@/hooks/useJobActions";
import { useJob } from "@/hooks/useJobs";
import {
  formatCurrency, formatAcres, formatOperationType, formatDate,
  formatPricingModel, formatCropType, formatRelative,
} from "@/lib/format";
import {
  ChevronRight, Calendar, DollarSign, User, MapPin, AlertTriangle,
  Clock, FileText, Truck, CheckCircle2, Package, ShieldCheck, Users,
  Ban, Edit, History,
} from "lucide-react";

export default function JobDetail() {
  const { jobId } = useParams();
  const { user, activeMode } = useAuth();
  const { data: job, isLoading } = useJob(jobId);

  if (isLoading) return <AppShell title=""><DetailSkeleton /></AppShell>;
  if (!job) {
    return (
      <AppShell title="">
        <EmptyState icon={<FileText size={24} />} title="Job not found" description="This job may have been removed or you don't have permission to view it." action={{ label: "Back to Jobs", to: "/jobs" }} />
      </AppShell>
    );
  }

  const jf = (job as any).job_fields?.[0];
  const fieldData = jf?.fields;
  const exceptions = (job as any).job_exceptions || [];
  const packets = (job as any).field_packets || [];
  const inputs = (job as any).job_inputs || [];
  const invoices = (job as any).invoices || [];
  const contractMode = (job as any).contract_mode || "fixed_price";
  const isCancelled = job.status === "cancelled";
  const cancelInfo = canCancelJob(job, user?.id || "");
  const editInfo = canEditJob(job, user?.id || "");

  return (
    <AppShell title="">
      <div className="animate-fade-in">
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <Link to="/jobs" className="hover:text-foreground transition-colors">Jobs</Link>
          <ChevronRight size={14} />
          <span className="text-foreground font-medium">{job.display_id}</span>
        </div>

        {/* Cancelled banner */}
        {isCancelled && (
          <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 mb-4 flex items-start gap-2">
            <Ban size={16} className="text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-destructive">Job Cancelled</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {(job as any).cancellation_reason
                  ? `Reason: ${(job as any).cancellation_reason}`
                  : "This job has been cancelled."}
              </p>
              {(job as any).cancelled_at && (
                <p className="text-[10px] text-muted-foreground mt-1">Cancelled {formatRelative((job as any).cancelled_at)}</p>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="rounded-lg bg-card border p-4 mb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold">{job.title}</h2>
                <StatusBadge status={job.status} />
                {job.urgency !== "normal" && (
                  <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full uppercase">{job.urgency}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {job.display_id} · {formatOperationType(job.operation_type)} · {formatAcres(Number(job.total_acres))} · {formatContractMode(contractMode)}
              </p>
            </div>
            {activeMode === "grower" && !isCancelled && (
              <div className="flex gap-2 flex-wrap">
                {job.proof_submitted && !job.proof_approved && <Button size="sm">Approve Completion</Button>}
                {cancelInfo.allowed && <CancelJobDialog job={job} />}
              </div>
            )}
          </div>
        </div>

        {/* Operator decision strip */}
        {activeMode === "operator" && ["requested", "quoted"].includes(job.status) && (
          <div className="mb-4">
            <OperatorDecisionStrip job={job} />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Map */}
            {fieldData && fieldData.centroid_lat && (
              <div className="rounded-lg bg-card border overflow-hidden">
                <FieldMap
                  field={{
                    id: jf.field_id, name: fieldData.name, farmId: "", county: "", state: "",
                    cropYear: 2026, centroid: { lat: Number(fieldData.centroid_lat), lng: Number(fieldData.centroid_lng) },
                    boundingBox: { north: 0, south: 0, east: 0, west: 0 },
                    acreage: Number(fieldData.acreage), crop: fieldData.crop, status: "active", createdAt: "", updatedAt: "",
                  }}
                  aspectRatio="21/9"
                />
              </div>
            )}

            {/* Quote comparison — grower view */}
            {activeMode === "grower" && ["requested", "quoted"].includes(job.status) && contractMode !== "fixed_price" && (
              <QuoteComparisonTable jobId={job.id} />
            )}

            {/* Details grid */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-card border p-3">
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Calendar size={13} /> Schedule</h3>
                <div className="space-y-1.5 text-[13px]">
                  <div className="flex justify-between"><span className="text-muted-foreground">Deadline</span><span className="font-medium">{formatDate(job.deadline)}</span></div>
                  {job.scheduled_start && <div className="flex justify-between"><span className="text-muted-foreground">Scheduled</span><span className="font-medium">{formatDate(job.scheduled_start)} – {formatDate(job.scheduled_end!)}</span></div>}
                  {job.actual_start && <div className="flex justify-between"><span className="text-muted-foreground">Started</span><span className="font-medium">{formatDate(job.actual_start)}</span></div>}
                  {(job as any).response_deadline && <div className="flex justify-between"><span className="text-muted-foreground">Response by</span><span className="font-medium text-warning">{formatDate((job as any).response_deadline)}</span></div>}
                </div>
              </div>

              <div className="rounded-lg bg-card border p-3">
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><DollarSign size={13} /> Pricing</h3>
                <div className="space-y-1.5 text-[13px]">
                  <div className="flex justify-between"><span className="text-muted-foreground">Model</span><span className="font-medium">{formatPricingModel(job.pricing_model)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span className="font-medium tabular-nums">{formatCurrency(Number(job.base_rate))}</span></div>
                  <div className="flex justify-between border-t pt-1.5"><span className="text-muted-foreground">Estimated</span><span className="font-bold tabular-nums">{formatCurrency(Number(job.estimated_total))}</span></div>
                  {job.approved_total && <div className="flex justify-between"><span className="text-muted-foreground">Approved</span><span className="font-medium tabular-nums text-success">{formatCurrency(Number(job.approved_total))}</span></div>}
                </div>
              </div>
            </div>

            {/* Fields */}
            {(job as any).job_fields?.length > 0 && (
              <div className="rounded-lg bg-card border">
                <div className="px-3 py-2 border-b"><h3 className="text-xs font-semibold">Fields ({(job as any).job_fields.length})</h3></div>
                <div className="divide-y">
                  {(job as any).job_fields.map((jf: any) => (
                    <Link key={jf.id} to={`/fields/${jf.field_id}`} className="flex items-center justify-between px-3 py-2.5 hover:bg-surface-2 transition-colors">
                      <div><p className="text-[13px] font-medium">{jf.fields?.name}</p><p className="text-[11px] text-muted-foreground">{formatCropType(jf.crop)} · {formatAcres(Number(jf.acreage))}</p></div>
                      <StatusBadge status={jf.status === "completed" ? "completed" : jf.status === "in_progress" ? "in_progress" : "scheduled"} />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Materials */}
            {inputs.length > 0 && (
              <div className="rounded-lg bg-card border">
                <div className="px-3 py-2 border-b"><h3 className="text-xs font-semibold flex items-center gap-1.5"><Package size={12} /> Materials ({inputs.length})</h3></div>
                <div className="divide-y">
                  {inputs.map((input: any) => (
                    <div key={input.id} className="px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-medium">{input.product_name}</p>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${input.supplied_by === "operator" ? "bg-primary/8 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                          {input.supplied_by === "operator" ? "Operator supplies" : "Grower supplies"}
                        </span>
                      </div>
                      {input.brand && <p className="text-[11px] text-muted-foreground mt-0.5">{input.brand}{input.variant ? ` · ${input.variant}` : ""}</p>}
                      {input.pickup_required && (
                        <p className="text-[11px] text-info mt-1 flex items-center gap-1"><Truck size={10} /> Pickup at {input.pickup_location_name || input.pickup_city}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exceptions */}
            {exceptions.length > 0 && (
              <div className="rounded-lg bg-card border">
                <div className="px-3 py-2 border-b"><h3 className="text-xs font-semibold flex items-center gap-1.5"><AlertTriangle size={12} className="text-destructive" /> Exceptions ({exceptions.length})</h3></div>
                <div className="divide-y">
                  {exceptions.map((exc: any) => (
                    <div key={exc.id} className="px-3 py-2.5">
                      <div className="flex items-center gap-2 mb-0.5">
                        <StatusBadge status={exc.status === "resolved" ? "completed" : "requested"} />
                        <span className="text-[10px] font-medium uppercase text-muted-foreground">{exc.type.replace("_", " ")}</span>
                      </div>
                      <p className="text-[13px]">{exc.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(exc.created_at)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Execution Panel */}
            {!isCancelled && (
              <JobExecutionPanel
                jobId={job.id}
                jobStatus={job.status}
                isOperator={activeMode === "operator"}
                isGrowerView={activeMode === "grower"}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Contract mode info */}
            <div className="rounded-lg bg-card border p-3">
              <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Users size={13} /> Contract Mode</h3>
              <p className="text-[13px] font-medium">{formatContractMode(contractMode)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {contractMode === "fixed_price" ? "Operators accept at posted rate." :
                 contractMode === "open_bidding" ? "Operators submit competing quotes." :
                 "Sent to invited operators only."}
              </p>
            </div>

            {/* Credential match - operator view */}
            {activeMode === "operator" && (
              <div className="rounded-lg bg-card border p-3">
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><ShieldCheck size={13} /> Credential Requirements</h3>
                <JobCredentialMatch operationType={job.operation_type} />
              </div>
            )}

            {/* Proof of work */}
            <div className="rounded-lg bg-card border p-3">
              <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><CheckCircle2 size={13} /> Proof of Work</h3>
              <div className="space-y-1.5 text-[13px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Submitted</span>{job.proof_submitted ? <span className="text-success font-medium">Yes</span> : <span className="text-muted-foreground">Pending</span>}</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Approved</span>{job.proof_approved ? <span className="text-success font-medium">Yes</span> : <span className="text-muted-foreground">Pending</span>}</div>
              </div>
            </div>

            {/* Invoices */}
            {invoices.length > 0 && (
              <div className="rounded-lg bg-card border p-3">
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><FileText size={13} /> Invoices</h3>
                <div className="space-y-1.5">
                  {invoices.map((inv: any) => (
                    <div key={inv.id} className="flex items-center justify-between text-[13px]">
                      <span className="font-medium">{inv.display_id}</span>
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums">{formatCurrency(Number(inv.total))}</span>
                        <StatusBadge status={inv.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Field Packets */}
            {packets.length > 0 && (
              <div className="rounded-lg bg-card border p-3">
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Package size={13} /> Field Packets</h3>
                <div className="space-y-1.5">
                  {packets.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between text-[13px] bg-surface-2 rounded-md p-2">
                      <div><p className="font-medium">v{p.version}</p><p className="text-[10px] text-muted-foreground">{p.field_packet_files?.length || 0} files</p></div>
                      <StatusBadge status={p.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="rounded-lg bg-card border p-3">
              <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Clock size={13} /> Timeline</h3>
              <div className="space-y-1.5 text-[13px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="font-medium">{formatDate(job.created_at)}</span></div>
                {job.scheduled_start && <div className="flex justify-between"><span className="text-muted-foreground">Scheduled</span><span className="font-medium">{formatDate(job.scheduled_start)}</span></div>}
                {job.actual_start && <div className="flex justify-between"><span className="text-muted-foreground">Started</span><span className="font-medium">{formatDate(job.actual_start)}</span></div>}
                {job.actual_end && <div className="flex justify-between"><span className="text-muted-foreground">Completed</span><span className="font-medium">{formatDate(job.actual_end)}</span></div>}
                {isCancelled && (job as any).cancelled_at && (
                  <div className="flex justify-between text-destructive"><span>Cancelled</span><span className="font-medium">{formatDate((job as any).cancelled_at)}</span></div>
                )}
                {(job as any).last_edited_at && (
                  <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><Edit size={10} /> Edited</span><span className="font-medium">{formatRelative((job as any).last_edited_at)}</span></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky action bar for operators */}
      {activeMode === "operator" && ["requested", "quoted"].includes(job.status) && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-3 flex gap-2 lg:hidden z-40">
          {contractMode === "fixed_price" ? (
            <Button className="flex-1 gap-1" size="sm"><CheckCircle2 size={14} /> Accept Job</Button>
          ) : (
            <Button className="flex-1 gap-1" size="sm"><FileText size={14} /> Submit Quote</Button>
          )}
          <Button variant="outline" size="sm">Save</Button>
        </div>
      )}
    </AppShell>
  );
}
