import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { FieldMap } from "@/components/map/FieldMap";
import { ActivityTimeline } from "@/components/shared/ActivityTimeline";
import { FieldPacketCard } from "@/components/shared/FieldPacketCard";
import { PricingSuggestionCard } from "@/components/intelligence/PricingSuggestionCard";
import { RouteContextBadge } from "@/components/intelligence/RouteContext";
import { WeatherPanel } from "@/components/weather/WeatherPanel";
import { usePricingEngine } from "@/hooks/useIntelligence";
import {
  getJobById, getFieldById, getExceptionsByJob, getQuotesByJob,
  getFieldPacketByJob, getInputsByJob, jobs, auditLogs, operators,
} from "@/data/mock";
import { MaterialInputsPanel, PickupRouteSummary } from "@/components/materials/MaterialInputsPanel";
import {
  formatCurrency, formatAcres, formatOperationType, formatDate,
  formatPricingModel, formatDistance, formatCropType,
} from "@/lib/format";
import {
  ChevronRight, Calendar, DollarSign, User, MapPin, AlertTriangle,
  Clock, FileText, Truck, CheckCircle2, Sparkles, Cloud, Package,
} from "lucide-react";
import { useEffect } from "react";

export default function JobDetail() {
  const { jobId } = useParams();
  const { activeMode } = useAuth();
  const job = getJobById(jobId || "job-1") || jobs[0];
  const field = getFieldById(job.fields[0]?.fieldId || "");
  const exceptions = getExceptionsByJob(job.id);
  const quotes = getQuotesByJob(job.id);
  const packet = getFieldPacketByJob(job.id);
  const inputs = getInputsByJob(job.id);
  const jobEvents = auditLogs.filter(a => a.entityId === job.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const { estimate, loading: pricingLoading, getEstimate } = usePricingEngine();

  const operator = operators.find(o => o.userId === job.operatorId);
  const operatorBase = operator?.baseLat ? { lat: operator.baseLat, lng: operator.baseLng! } : null;
  const fieldLocation = field?.centroid ? { lat: field.centroid.lat, lng: field.centroid.lng } : null;

  useEffect(() => {
    if (job && ["requested", "quoted"].includes(job.status)) {
      getEstimate({
        operation_type: job.operationType,
        acreage: job.totalAcres,
        travel_distance: job.travelDistance,
        urgency: job.urgency,
        crop: job.fields[0]?.crop,
      });
    }
  }, [job?.id]);

  return (
    <AppShell title="">
      <div className="animate-fade-in">
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <Link to="/jobs" className="hover:text-foreground transition-colors">Jobs</Link>
          <ChevronRight size={14} />
          <span className="text-foreground font-medium">{job.displayId}</span>
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
              <p className="text-sm text-muted-foreground">{job.displayId} · {formatOperationType(job.operationType)} · {formatAcres(job.totalAcres)}</p>
            </div>
            <div className="flex gap-2">
              {activeMode === "grower" && job.proofSubmitted && !job.proofApproved && <Button size="sm">Approve Completion</Button>}
              {activeMode === "operator" && !job.proofSubmitted && ["in_progress", "completed"].includes(job.status) && <Button size="sm">Submit Proof of Work</Button>}
              {activeMode === "operator" && job.status === "requested" && <Button size="sm">Submit Quote</Button>}
              {activeMode === "operator" && job.status === "scheduled" && <Button size="sm" variant="outline">Start Job</Button>}
              <Button size="sm" variant="outline">Actions</Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Left column — main info */}
          <div className="lg:col-span-2 space-y-5">
            {/* Map */}
            {field && (
              <div className="rounded-xl bg-card shadow-card overflow-hidden">
                <FieldMap field={field} aspectRatio="21/9" />
              </div>
            )}

            {/* Details grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-card shadow-card p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Calendar size={15} /> Schedule</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Deadline</span><span className="font-medium">{formatDate(job.deadline)}</span></div>
                  {job.scheduledStart && <div className="flex justify-between"><span className="text-muted-foreground">Scheduled</span><span className="font-medium">{formatDate(job.scheduledStart)} – {formatDate(job.scheduledEnd!)}</span></div>}
                  {job.actualStart && <div className="flex justify-between"><span className="text-muted-foreground">Started</span><span className="font-medium">{formatDate(job.actualStart)}</span></div>}
                  {job.actualEnd && <div className="flex justify-between"><span className="text-muted-foreground">Completed</span><span className="font-medium">{formatDate(job.actualEnd)}</span></div>}
                </div>
              </div>

              <div className="rounded-xl bg-card shadow-card p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><DollarSign size={15} /> Pricing</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Model</span><span className="font-medium">{formatPricingModel(job.pricingModel)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span className="font-medium tabular">{formatCurrency(job.baseRate)}</span></div>
                  <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Estimated</span><span className="font-bold tabular">{formatCurrency(job.estimatedTotal)}</span></div>
                  {job.approvedTotal && <div className="flex justify-between"><span className="text-muted-foreground">Approved</span><span className="font-medium tabular text-success">{formatCurrency(job.approvedTotal)}</span></div>}
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className="rounded-xl bg-card shadow-card">
              <div className="p-4 border-b"><h3 className="font-semibold text-sm">Fields ({job.fields.length})</h3></div>
              <div className="divide-y">
                {job.fields.map(jf => (
                  <Link key={jf.id} to={`/fields/${jf.fieldId}`} className="flex items-center justify-between p-4 hover:bg-surface-2 transition-colors">
                    <div><p className="text-sm font-medium">{jf.fieldName}</p><p className="text-xs text-muted-foreground">{formatCropType(jf.crop)} · {formatAcres(jf.acreage)}</p></div>
                    <StatusBadge status={jf.status === "completed" ? "completed" : jf.status === "in_progress" ? "in_progress" : "scheduled"} />
                  </Link>
                ))}
              </div>
            </div>

            {/* Exceptions */}
            {exceptions.length > 0 && (
              <div className="rounded-xl bg-card shadow-card">
                <div className="p-4 border-b"><h3 className="font-semibold text-sm flex items-center gap-2"><AlertTriangle size={14} className="text-destructive" /> Exceptions ({exceptions.length})</h3></div>
                <div className="divide-y">
                  {exceptions.map(exc => (
                    <div key={exc.id} className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={exc.status === "resolved" ? "completed" : exc.status === "open" ? "requested" : "in_progress"} />
                        <span className="text-xs font-medium uppercase text-muted-foreground">{exc.type.replace("_", " ")}</span>
                      </div>
                      <p className="text-sm">{exc.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">Raised by {exc.raisedByName} · {formatDate(exc.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quotes */}
            {quotes.length > 0 && (
              <div className="rounded-xl bg-card shadow-card">
                <div className="p-4 border-b"><h3 className="font-semibold text-sm">Quotes ({quotes.length})</h3></div>
                <div className="divide-y">
                  {quotes.map(q => (
                    <div key={q.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{q.operatorName}</p>
                        <p className="text-xs text-muted-foreground">{formatPricingModel(q.pricingModel)} · {formatCurrency(q.baseRate)}/ac + {formatCurrency(q.travelFee)} travel</p>
                        {q.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{q.notes}"</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold tabular">{formatCurrency(q.totalQuote)}</p>
                        <StatusBadge status={q.status === "accepted" ? "accepted" : q.status === "declined" ? "cancelled" : "requested"} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Field Packet */}
            {packet && <FieldPacketCard packet={packet} />}
          </div>

          {/* Right column — sidebar */}
          <div className="space-y-5">
            {/* Weather */}
            {field && (
              <WeatherPanel fieldId={field.id} lat={field.centroid?.lat} lng={field.centroid?.lng} operationType={job.operationType} />
            )}

            {/* Route context for operators */}
            {activeMode === "operator" && operatorBase && fieldLocation && (
              <div className="rounded-xl bg-card shadow-card p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Truck size={15} /> Route Context</h3>
                <RouteContextBadge operatorBase={operatorBase} fieldLocation={fieldLocation} />
              </div>
            )}

            {/* AI Pricing */}
            {["requested", "quoted"].includes(job.status) && (
              <PricingSuggestionCard estimate={estimate} loading={pricingLoading} acreage={job.totalAcres} />
            )}

            {/* Operator */}
            {job.operatorName && (
              <div className="rounded-xl bg-card shadow-card p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><User size={15} /> Operator</h3>
                <p className="text-sm font-medium">{job.operatorName}</p>
                {job.travelDistance && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Truck size={13} />
                    <span>{formatDistance(job.travelDistance)} · {job.travelEta} min ETA</span>
                  </div>
                )}
              </div>
            )}

            {/* Split payment */}
            {job.splitPayment && job.splitRules && (
              <div className="rounded-xl bg-card shadow-card p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><DollarSign size={15} /> Split Payment</h3>
                <div className="space-y-2">
                  {job.splitRules.map(sr => (
                    <div key={sr.id} className="flex items-center justify-between text-sm">
                      <div><p className="font-medium">{sr.payerName}</p><p className="text-xs text-muted-foreground capitalize">{sr.payerRole}</p></div>
                      <div className="text-right"><p className="font-bold tabular">{sr.percentage}%</p><p className="text-xs text-muted-foreground tabular">{formatCurrency(job.estimatedTotal * sr.percentage / 100)}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Proof of work status */}
            <div className="rounded-xl bg-card shadow-card p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><CheckCircle2 size={15} /> Proof of Work</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Submitted</span>{job.proofSubmitted ? <span className="text-success font-medium">Yes</span> : <span className="text-muted-foreground">Pending</span>}</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Approved</span>{job.proofApproved ? <span className="text-success font-medium">Yes</span> : <span className="text-muted-foreground">Pending</span>}</div>
              </div>
            </div>

            {/* Activity */}
            <div className="rounded-xl bg-card shadow-card p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Clock size={15} /> Activity</h3>
              <ActivityTimeline events={jobEvents} maxItems={8} />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
