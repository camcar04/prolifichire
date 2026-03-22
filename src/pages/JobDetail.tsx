import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { FieldMap } from "@/components/map/FieldMap";
import { DetailSkeleton } from "@/components/shared/PageSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { LiabilityDisclaimer } from "@/components/shared/LiabilityDisclaimer";
import { JobCredentialMatch } from "@/components/operators/JobCredentialMatch";
import { JobEquipmentMatch } from "@/components/operators/JobEquipmentMatch";
import { QuoteComparisonTable } from "@/components/jobs/QuoteComparisonTable";
import { OperatorDecisionStrip } from "@/components/jobs/OperatorDecisionStrip";
import { JobExecutionPanel } from "@/components/jobs/JobExecutionPanel";
import { ExecutionChecklist } from "@/components/jobs/ExecutionChecklist";
import { CancelJobDialog } from "@/components/jobs/CancelJobDialog";
import { PrivateCostCalculator } from "@/components/operators/PrivateCostCalculator";
import { ProfitReviewPanel } from "@/components/operators/ProfitReviewPanel";
import { ContractSignatureDialog } from "@/components/contracts/ContractSignatureDialog";
import { formatContractMode } from "@/components/jobs/ContractModeSelector";
import { canCancelJob, canEditJob } from "@/hooks/useJobActions";
import { useJob } from "@/hooks/useJobs";
import { usePostJobUpdate, type JobUpdateStatus, UPDATE_STATUS_LABELS } from "@/hooks/useJobExecution";
import {
  formatCurrency, formatAcres, formatOperationType, formatDate,
  formatPricingModel, formatCropType, formatRelative,
} from "@/lib/format";
import {
  ChevronRight, Calendar, DollarSign, User, MapPin, AlertTriangle,
  Clock, FileText, Truck, CheckCircle2, Package, ShieldCheck, Users,
  Ban, Edit, History, Navigation, Phone, Download, Compass, TriangleAlert,
  Play, Pause, Camera, MessageSquare, Pen,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function JobDetail() {
  const { jobId } = useParams();
  const { user, activeMode } = useAuth();
  const { data: job, isLoading } = useJob(jobId);
  const [signingContractId, setSigningContractId] = useState<string | null>(null);

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
  const specs = (job as any).operation_specs || [];
  const contractMode = (job as any).contract_mode || "fixed_price";
  const isCancelled = job.status === "cancelled";
  const cancelInfo = canCancelJob(job, user?.id || "");
  const isOperatorView = activeMode === "operator";
  const isActive = ["accepted", "scheduled", "in_progress"].includes(job.status);
  const hasField = fieldData && fieldData.centroid_lat;

  // Build field object for map — uses new FieldMap interface with real GeoJSON
  const mapField = hasField ? {
    id: jf.field_id, name: fieldData.name,
    acreage: Number(fieldData.acreage), status: "active" as string,
    centroid_lat: Number(fieldData.centroid_lat),
    centroid_lng: Number(fieldData.centroid_lng),
    bbox_north: fieldData.bbox_north ? Number(fieldData.bbox_north) : null,
    bbox_south: fieldData.bbox_south ? Number(fieldData.bbox_south) : null,
    bbox_east: fieldData.bbox_east ? Number(fieldData.bbox_east) : null,
    bbox_west: fieldData.bbox_west ? Number(fieldData.bbox_west) : null,
    boundary_geojson: (fieldData as any).boundary_geojson || null,
  } : null;

  // For operator active jobs, use mission-control layout
  if (isOperatorView && isActive) {
    return (
      <AppShell title="">
        <div className="animate-fade-in">
          {/* Top execution bar — compact, dense, informational */}
          <div className="flex items-center gap-2 px-1 py-2 mb-2 border-b">
            <Link to="/jobs" className="text-[11px] text-muted-foreground hover:text-foreground">Jobs</Link>
            <ChevronRight size={9} className="text-muted-foreground" />
            <span className="text-[11px] font-mono font-medium">{job.display_id}</span>
            <StatusBadge status={job.status} />
            {job.urgency !== "normal" && (
              <span className="text-[9px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full uppercase">{job.urgency}</span>
            )}
            <div className="ml-auto flex items-center gap-3 text-[11px]">
              <span className="font-semibold">{formatOperationType(job.operation_type)}</span>
              <span className="text-muted-foreground">·</span>
              <span className="tabular-nums">{formatAcres(Number(job.total_acres))}</span>
              <span className="text-muted-foreground">·</span>
              <span className="tabular-nums font-bold">{formatCurrency(Number(job.estimated_total))}</span>
              {job.scheduled_start && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="flex items-center gap-1 text-muted-foreground"><Clock size={10} />{formatDate(job.scheduled_start)}</span>
                </>
              )}
            </div>
          </div>

          {/* 3-zone mission control */}
          <div className="grid lg:grid-cols-12 gap-3">
            {/* LEFT — Map + location (dominant) */}
            <div className="lg:col-span-5 space-y-3">
              {mapField ? (
                <div className="rounded-lg border overflow-hidden bg-card">
                  <div style={{ height: "340px" }}>
                    <FieldMap field={mapField} aspectRatio="auto" showControls />
                  </div>
                  <div className="px-3 py-2.5 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[12px]">
                        <MapPin size={12} className="text-primary shrink-0" />
                        <span className="font-semibold">{fieldData.name}</span>
                      </div>
                      {fieldData.crop && (
                        <span className="text-[10px] text-muted-foreground">{formatCropType(fieldData.crop)}</span>
                      )}
                    </div>
                    {job.travel_distance && (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
                        <Navigation size={10} className="shrink-0" />
                        <span>{Number(job.travel_distance).toFixed(0)} mi away</span>
                        {job.travel_eta && <span>· ~{job.travel_eta} min</span>}
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {fieldData.centroid_lat.toFixed(4)}°N, {Math.abs(Number(fieldData.centroid_lng)).toFixed(4)}°W
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-card p-8 text-center">
                  <MapPin size={24} className="mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">No field location data available</p>
                </div>
              )}

              {/* Execution checklist */}
              <ExecutionChecklist job={job} packets={packets} />
            </div>

            {/* CENTER — Packet + instructions + controls */}
            <div className="lg:col-span-4 space-y-3">
              {/* Field Packet */}
              <div className="rounded-lg border bg-card">
                <div className="px-3 py-2 border-b flex items-center justify-between">
                  <h3 className="text-[11px] font-semibold flex items-center gap-1.5">
                    <Package size={12} className="text-primary" /> Field Packet
                  </h3>
                  {packets.length > 0 && (
                    <span className="text-[10px] text-primary font-medium">v{packets[0].version}</span>
                  )}
                </div>
                {packets.length > 0 ? (
                  <div className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={packets[0].status} />
                      <span className="text-[10px] text-muted-foreground">{packets[0].field_packet_files?.length || 0} files</span>
                    </div>
                    {packets[0].field_packet_files?.filter((f: any) => f.included).map((f: any) => (
                      <div key={f.id} className="flex items-center justify-between py-1 text-[11px]">
                        <span className="flex items-center gap-1.5 text-muted-foreground"><FileText size={10} />{f.file_name || f.category}</span>
                        <span className="text-[9px] text-muted-foreground uppercase">{f.format}</span>
                      </div>
                    ))}
                    {packets[0].missing_required?.length > 0 && (
                      <div className="rounded bg-warning/5 border border-warning/20 p-2 mt-1">
                        <p className="text-[10px] font-medium text-warning flex items-center gap-1 mb-1"><TriangleAlert size={10} /> Missing Required</p>
                        {packets[0].missing_required.map((m: string) => (
                          <p key={m} className="text-[10px] text-muted-foreground ml-3.5">· {m}</p>
                        ))}
                      </div>
                    )}
                    <Button size="sm" variant="outline" className="w-full text-[11px] h-7 gap-1 mt-1">
                      <Download size={10} /> Download All Files
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <Package size={18} className="mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-[11px] text-muted-foreground">No packet generated yet</p>
                  </div>
                )}
              </div>

              {/* Operation details */}
              {(specs.length > 0 || inputs.length > 0) && (
                <div className="rounded-lg border bg-card">
                  <div className="px-3 py-2 border-b">
                    <h3 className="text-[11px] font-semibold flex items-center gap-1.5"><Compass size={12} /> Operation Details</h3>
                  </div>
                  <div className="p-3 space-y-2 text-[12px]">
                    {specs.map((s: any) => (
                      <div key={s.id} className="space-y-1">
                        {s.application_method && <Row label="Method" value={s.application_method} />}
                        {s.target_rate && <Row label="Rate" value={`${s.target_rate} ${s.rate_unit || ""}`} />}
                        {s.passes && <Row label="Passes" value={String(s.passes)} />}
                        {s.variable_rate && <Row label="Variable Rate" value="Yes" />}
                      </div>
                    ))}
                    {inputs.map((input: any) => (
                      <div key={input.id} className="flex items-center justify-between py-1 border-t first:border-0 first:pt-0">
                        <div>
                          <p className="font-medium">{input.product_name}</p>
                          {input.brand && <p className="text-[10px] text-muted-foreground">{input.brand}{input.variant ? ` · ${input.variant}` : ""}</p>}
                        </div>
                        <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded",
                          input.supplied_by === "operator" ? "bg-primary/8 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          {input.supplied_by === "operator" ? "You supply" : "Grower supplies"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Execution panel */}
              <JobExecutionPanel jobId={job.id} jobStatus={job.status} isOperator={true} isGrowerView={false} />

              {/* Notes */}
              {(job.description || job.notes || job.requirements) && (
                <div className="rounded-lg border bg-card p-3 space-y-2">
                  {job.description && <div><p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Description</p><p className="text-[12px]">{job.description}</p></div>}
                  {job.requirements && <div><p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Requirements</p><p className="text-[12px]">{job.requirements}</p></div>}
                  {job.notes && <div><p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Notes</p><p className="text-[12px]">{job.notes}</p></div>}
                </div>
              )}
            </div>

            {/* RIGHT — Status, timeline, cost, actions */}
            <div className="lg:col-span-3 space-y-3">
              {/* Quick job info */}
              <div className="rounded-lg border bg-card p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Job Info</p>
                <div className="space-y-1.5 text-[12px]">
                  <Row label="Type" value={formatOperationType(job.operation_type)} />
                  <Row label="Crop" value={fieldData ? formatCropType(fieldData.crop) : "—"} />
                  <Row label="Acres" value={formatAcres(Number(job.total_acres))} />
                  <Row label="Deadline" value={formatDate(job.deadline)} />
                  <Row label="Rate" value={`${formatCurrency(Number(job.base_rate))} ${formatPricingModel(job.pricing_model)}`} />
                  <Row label="Payout" value={formatCurrency(Number(job.estimated_total))} bold />
                </div>
              </div>

              {/* Status timeline */}
              <div className="rounded-lg border bg-card p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Timeline</p>
                <div className="space-y-1.5 text-[12px]">
                  <Row label="Created" value={formatDate(job.created_at)} />
                  {job.scheduled_start && <Row label="Scheduled" value={formatDate(job.scheduled_start)} />}
                  {job.actual_start && <Row label="Started" value={formatDate(job.actual_start)} />}
                  {job.actual_end && <Row label="Completed" value={formatDate(job.actual_end)} />}
                </div>
              </div>

              {/* Proof of work */}
              <div className="rounded-lg border bg-card p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Proof of Work</p>
                <div className="flex gap-3 text-[12px]">
                  <div className="flex items-center gap-1">
                    {job.proof_submitted ? <CheckCircle2 size={11} className="text-success" /> : <Clock size={11} className="text-muted-foreground" />}
                    <span>{job.proof_submitted ? "Submitted" : "Pending"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {job.proof_approved ? <CheckCircle2 size={11} className="text-success" /> : <Clock size={11} className="text-muted-foreground" />}
                    <span>{job.proof_approved ? "Approved" : "Review"}</span>
                  </div>
                </div>
              </div>

              {/* Private cost */}
              <PrivateCostCalculator job={job} />

              {/* Qualifications */}
              <div className="rounded-lg border bg-card p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Qualifications</p>
                <JobCredentialMatch operationType={job.operation_type} />
                <div className="mt-2"><JobEquipmentMatch operationType={job.operation_type} compact /></div>
              </div>

              {/* Invoices */}
              {invoices.length > 0 && (
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Invoices</p>
                  {invoices.map((inv: any) => (
                    <div key={inv.id} className="flex items-center justify-between text-[12px] py-1">
                      <span>{inv.display_id}</span>
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums font-medium">{formatCurrency(Number(inv.total))}</span>
                        <StatusBadge status={inv.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Exceptions */}
              {exceptions.length > 0 && (
                <div className="rounded-lg border border-destructive/20 bg-card p-3">
                  <p className="text-[10px] font-semibold text-destructive uppercase tracking-wider mb-2 flex items-center gap-1">
                    <AlertTriangle size={10} /> Exceptions ({exceptions.length})
                  </p>
                  {exceptions.map((exc: any) => (
                    <div key={exc.id} className="text-[11px] py-1 border-t first:border-0 first:pt-0">
                      <p className="font-medium">{exc.type.replace("_", " ")}</p>
                      <p className="text-muted-foreground">{exc.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile sticky execution bar */}
          <div className="fixed bottom-14 left-0 right-0 bg-card/95 backdrop-blur-sm border-t p-2.5 flex gap-2 lg:hidden z-40">
            <Button size="sm" className="flex-1 gap-1 h-10 text-xs font-semibold">
              <Play size={14} /> Update Status
            </Button>
            <Button size="sm" variant="outline" className="gap-1 h-10 text-xs">
              <Camera size={14} />
            </Button>
            <Button size="sm" variant="outline" className="gap-1 h-10 text-xs">
              <Download size={14} />
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  // DEFAULT LAYOUT — for non-active or grower views
  return (
    <AppShell title="">
      <div className="animate-fade-in max-w-5xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <Link to="/jobs" className="hover:text-foreground transition-colors">Jobs</Link>
          <ChevronRight size={14} />
          <span className="text-foreground font-medium">{job.display_id}</span>
        </div>

        {/* Cancelled banner */}
        {isCancelled && (
          <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 mb-3 flex items-start gap-2">
            <Ban size={16} className="text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-destructive">Job Cancelled</p>
              {(job as any).cancellation_reason && <p className="text-[12px] text-muted-foreground mt-0.5">Reason: {(job as any).cancellation_reason}</p>}
              {(job as any).cancelled_at && <p className="text-[10px] text-muted-foreground mt-1">Cancelled {formatRelative((job as any).cancelled_at)}</p>}
            </div>
          </div>
        )}

        {/* Header strip — not a card, just a clean bar */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 pb-3 border-b">
          <h1 className="text-lg font-bold">{job.title}</h1>
          <StatusBadge status={job.status} />
          {job.urgency !== "normal" && (
            <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full uppercase">{job.urgency}</span>
          )}
          <span className="text-[12px] text-muted-foreground ml-auto">
            {job.display_id} · {formatOperationType(job.operation_type)} · {formatAcres(Number(job.total_acres))} · {formatContractMode(contractMode)}
          </span>
          {activeMode === "grower" && !isCancelled && (
            <div className="flex gap-2">
              {job.proof_submitted && !job.proof_approved && <Button size="sm" className="h-7 text-xs">Approve Work</Button>}
              {cancelInfo.allowed && <CancelJobDialog job={job} />}
            </div>
          )}
        </div>

        {/* Operator decision strip + private costing for marketplace/quoted jobs */}
        {isOperatorView && ["requested", "quoted"].includes(job.status) && (
          <div className="mb-4 space-y-3">
            <OperatorDecisionStrip job={job} />
            <PrivateCostCalculator job={job} />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Map */}
            {mapField && (
              <div className="rounded-lg border overflow-hidden bg-card">
                <FieldMap field={mapField} aspectRatio="21/9" />
              </div>
            )}

            {/* Quote comparison — grower view */}
            {activeMode === "grower" && ["requested", "quoted"].includes(job.status) && contractMode !== "fixed_price" && (
              <QuoteComparisonTable jobId={job.id} />
            )}

            {/* KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-lg border overflow-hidden bg-border">
              {[
                { label: "Deadline", value: formatDate(job.deadline), icon: Calendar },
                { label: "Rate", value: `${formatCurrency(Number(job.base_rate))} ${formatPricingModel(job.pricing_model)}`, icon: DollarSign },
                { label: "Estimated", value: formatCurrency(Number(job.estimated_total)), icon: DollarSign },
                { label: "Mode", value: formatContractMode(contractMode), icon: Users },
              ].map(k => (
                <div key={k.label} className="bg-card p-3">
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1"><k.icon size={10} />{k.label}</p>
                  <p className="text-[13px] font-semibold tabular-nums mt-0.5">{k.value}</p>
                </div>
              ))}
            </div>

            {/* Fields table */}
            {(job as any).job_fields?.length > 0 && (
              <div className="rounded-lg border bg-card overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead><tr className="text-left text-[10px] text-muted-foreground uppercase tracking-wider border-b bg-muted/30">
                    <th className="px-3 py-1.5 font-medium">Field</th>
                    <th className="px-3 py-1.5 font-medium">Crop</th>
                    <th className="px-3 py-1.5 font-medium text-right">Acres</th>
                    <th className="px-3 py-1.5 font-medium text-right">Status</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {(job as any).job_fields.map((jf: any) => (
                      <tr key={jf.id} className="hover:bg-surface-2 transition-colors">
                        <td className="px-3 py-2"><Link to={`/fields/${jf.field_id}`} className="font-medium text-primary hover:underline">{jf.fields?.name}</Link></td>
                        <td className="px-3 py-2 text-muted-foreground">{formatCropType(jf.crop)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatAcres(Number(jf.acreage))}</td>
                        <td className="px-3 py-2 text-right"><StatusBadge status={jf.status === "completed" ? "completed" : "scheduled"} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Materials as list */}
            {inputs.length > 0 && (
              <div className="rounded-lg border bg-card overflow-hidden">
                <div className="px-3 py-2 border-b"><h3 className="text-[11px] font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider"><Package size={10} /> Materials</h3></div>
                <div className="divide-y">
                  {inputs.map((input: any) => (
                    <div key={input.id} className="px-3 py-2 flex items-center justify-between">
                      <div>
                        <p className="text-[12px] font-medium">{input.product_name}</p>
                        {input.brand && <p className="text-[10px] text-muted-foreground">{input.brand}{input.variant ? ` · ${input.variant}` : ""}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {input.pickup_required && <span className="text-[10px] text-info flex items-center gap-0.5"><Truck size={9} /> Pickup</span>}
                        <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded", input.supplied_by === "operator" ? "bg-primary/8 text-primary" : "bg-muted text-muted-foreground")}>
                          {input.supplied_by === "operator" ? "Operator" : "Grower"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exceptions */}
            {exceptions.length > 0 && (
              <div className="rounded-lg border border-destructive/20 bg-card overflow-hidden">
                <div className="px-3 py-2 border-b"><h3 className="text-[11px] font-semibold flex items-center gap-1.5 text-destructive uppercase tracking-wider"><AlertTriangle size={10} /> Exceptions</h3></div>
                <div className="divide-y">
                  {exceptions.map((exc: any) => (
                    <div key={exc.id} className="px-3 py-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <StatusBadge status={exc.status === "resolved" ? "completed" : "requested"} />
                        <span className="text-[10px] font-medium uppercase text-muted-foreground">{exc.type.replace("_", " ")}</span>
                      </div>
                      <p className="text-[12px]">{exc.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Execution */}
            {!isCancelled && (
              <JobExecutionPanel jobId={job.id} jobStatus={job.status} isOperator={isOperatorView} isGrowerView={activeMode === "grower"} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            {/* Credential match - operator */}
            {isOperatorView && (
              <div className="rounded-lg border bg-card p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Qualifications</p>
                <JobCredentialMatch operationType={job.operation_type} />
                <div className="mt-2"><JobEquipmentMatch operationType={job.operation_type} compact /></div>
              </div>
            )}

            {/* Proof of work */}
            <div className="rounded-lg border bg-card p-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Proof of Work</p>
              <div className="space-y-1.5 text-[12px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Submitted</span>{job.proof_submitted ? <span className="text-success font-medium">Yes</span> : <span className="text-muted-foreground">Pending</span>}</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Approved</span>{job.proof_approved ? <span className="text-success font-medium">Yes</span> : <span className="text-muted-foreground">Pending</span>}</div>
              </div>
            </div>

            {/* Profit Review — operator only, completed jobs */}
            {isOperatorView && ["completed", "approved", "paid", "closed"].includes(job.status) && (
              <ProfitReviewPanel job={job} />
            )}

            {/* Field Packets */}
            {packets.length > 0 && (
              <div className="rounded-lg border bg-card p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Field Packets</p>
                {packets.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between text-[12px] py-1">
                    <span>v{p.version} · {p.field_packet_files?.length || 0} files</span>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            )}

            {/* Invoices */}
            {invoices.length > 0 && (
              <div className="rounded-lg border bg-card p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Invoices</p>
                {invoices.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between text-[12px] py-1">
                    <span>{inv.display_id}</span>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums font-medium">{formatCurrency(Number(inv.total))}</span>
                      <StatusBadge status={inv.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Timeline */}
            <div className="rounded-lg border bg-card p-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Timeline</p>
              <div className="space-y-1.5 text-[12px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{formatDate(job.created_at)}</span></div>
                {job.scheduled_start && <div className="flex justify-between"><span className="text-muted-foreground">Scheduled</span><span>{formatDate(job.scheduled_start)}</span></div>}
                {job.actual_start && <div className="flex justify-between"><span className="text-muted-foreground">Started</span><span>{formatDate(job.actual_start)}</span></div>}
                {job.actual_end && <div className="flex justify-between"><span className="text-muted-foreground">Completed</span><span>{formatDate(job.actual_end)}</span></div>}
                {isCancelled && (job as any).cancelled_at && (
                  <div className="flex justify-between text-destructive"><span>Cancelled</span><span>{formatDate((job as any).cancelled_at)}</span></div>
                )}
              </div>
            </div>

            {/* Description in sidebar for non-active */}
            {(job.description || job.notes) && (
              <div className="rounded-lg border bg-card p-3 space-y-2">
                {job.description && <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 font-medium">Description</p><p className="text-[12px]">{job.description}</p></div>}
                {job.notes && <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 font-medium">Notes</p><p className="text-[12px]">{job.notes}</p></div>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky action bar for operators */}
      {isOperatorView && ["requested", "quoted"].includes(job.status) && (
        <div className="fixed bottom-14 left-0 right-0 bg-card/95 backdrop-blur-sm border-t p-2.5 flex gap-2 lg:hidden z-40">
          {contractMode === "fixed_price" ? (
            <Button className="flex-1 gap-1 h-9 text-xs"><CheckCircle2 size={13} /> Accept Job</Button>
          ) : (
            <Button className="flex-1 gap-1 h-9 text-xs"><FileText size={13} /> Submit Quote</Button>
          )}
        </div>
      )}
    </AppShell>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={cn("text-right truncate", bold ? "font-bold" : "font-medium")}>{value}</span>
    </div>
  );
}
