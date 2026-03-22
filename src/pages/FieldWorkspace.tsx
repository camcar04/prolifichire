import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { FieldMap } from "@/components/map/FieldMap";
import { ActivityTimeline } from "@/components/shared/ActivityTimeline";
import { FileRow } from "@/components/shared/FileRow";
import { FieldPacketCard } from "@/components/shared/FieldPacketCard";
import {
  getFieldById, getJobsByField, getDatasetsByField, getAuditLogsByField,
  getFieldRequirements, getFieldAccess, fieldStats, getInvoicesByField,
  getThreadsByField, getMessagesByThread, getPermissionsByField, fieldPackets,
  fields,
} from "@/data/mock";
import {
  formatCurrency, formatAcres, formatOperationType, formatCropType,
  formatDate, formatPricingModel,
} from "@/lib/format";
import {
  ChevronRight, Download, Layers, User, Calendar, AlertTriangle,
  FileText, DollarSign, MessageSquare, Shield, Clock, Map,
  Send, Paperclip, Plus, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

const growerTabs = [
  { id: "overview", label: "Overview", icon: Layers },
  { id: "jobs", label: "Jobs", icon: FileText },
  { id: "history", label: "History", icon: Clock },
  { id: "files", label: "Files & Maps", icon: Map },
  { id: "financials", label: "Financials", icon: DollarSign },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "permissions", label: "Permissions", icon: Shield },
];

const operatorTabs = [
  { id: "overview", label: "Overview", icon: Layers },
  { id: "files", label: "Files & Packet", icon: Map },
  { id: "jobs", label: "Job Details", icon: FileText },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "history", label: "History", icon: Clock },
];

export default function FieldWorkspace() {
  const { fieldId } = useParams();
  const [activeTab, setActiveTab] = useState("overview");

  const field = getFieldById(fieldId || "fld-1") || fields[0];
  const stats = fieldStats[field.id];
  const requirements = getFieldRequirements(field.id);
  const access = getFieldAccess(field.id);
  const fieldJobs = getJobsByField(field.id);
  const fieldDatasets = getDatasetsByField(field.id);
  const fieldAuditLogs = getAuditLogsByField(field.id);
  const fieldInvoices = getInvoicesByField(field.id);
  const fieldThreads = getThreadsByField(field.id);
  const fieldPermissions = getPermissionsByField(field.id);
  const packet = fieldPackets.find(p => p.fieldId === field.id);
  const activeJob = fieldJobs.find(j => ["in_progress", "scheduled", "accepted"].includes(j.status));

  return (
    <AppShell title="">
      <div className="animate-fade-in">
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <Link to="/fields" className="hover:text-foreground transition-colors">Fields</Link>
          <ChevronRight size={14} />
          <span className="text-foreground font-medium">{field.name}</span>
        </div>

        {/* Top: Map + Info */}
        <div className="grid lg:grid-cols-5 gap-5 mb-6">
          <div className="lg:col-span-3 rounded-xl bg-card shadow-card overflow-hidden relative">
            <FieldMap field={field} aspectRatio="16/10" />
            <div className="absolute top-3 left-3"><StatusBadge status={field.status} /></div>
          </div>

          <div className="lg:col-span-2 rounded-xl bg-card shadow-card p-5 flex flex-col gap-3">
            <div>
              <h2 className="text-xl font-bold">{field.name}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{formatCropType(field.crop)} · {field.cropYear} · {field.county} County, {field.state}</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <InfoBlock label="Acreage" value={formatAcres(field.acreage)} />
              <InfoBlock label="Status" value={<StatusBadge status={field.status} />} />
              {activeJob && <InfoBlock label="Active Job" value={`${activeJob.displayId} · ${formatOperationType(activeJob.operationType)}`} />}
              {activeJob?.operatorName && <InfoBlock label="Operator" value={activeJob.operatorName} icon={<User size={13} />} />}
              {activeJob?.travelDistance && <InfoBlock label="Travel" value={`${activeJob.travelDistance} mi · ${activeJob.travelEta} min`} />}
              {stats && <InfoBlock label="Avg Cost" value={`${formatCurrency(stats.avgCostPerAcre)}/ac`} />}
            </div>
            <div className="mt-auto pt-3 border-t flex gap-2">
              {packet && <Button size="sm" className="flex-1"><FileText size={14} /> Field Packet</Button>}
              <Button variant="outline" size="sm"><Download size={14} /></Button>
            </div>
          </div>
        </div>

        {/* Requirements + Access */}
        {(requirements.length > 0 || access) && (
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {requirements.length > 0 && (
              <div className="rounded-xl bg-card shadow-card p-4">
                <h3 className="text-sm font-semibold mb-3">Field Requirements</h3>
                <div className="space-y-2">
                  {requirements.map(r => (
                    <div key={r.id} className={cn("flex items-start gap-2 rounded-lg p-2.5 text-sm",
                      r.severity === "critical" ? "bg-destructive/8" : r.severity === "warning" ? "bg-warning/8" : "bg-info/8"
                    )}>
                      <AlertTriangle size={14} className={cn("mt-0.5 shrink-0",
                        r.severity === "critical" ? "text-destructive" : r.severity === "warning" ? "text-warning" : "text-info"
                      )} />
                      <div>
                        <p className="font-medium">{r.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Applies to: {r.appliesTo.map(formatOperationType).join(", ")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {access && (
              <div className="rounded-xl bg-card shadow-card p-4">
                <h3 className="text-sm font-semibold mb-3">Access Instructions</h3>
                <p className="text-sm leading-relaxed">{access.directions}</p>
                {access.gateCode && <p className="text-sm mt-2"><span className="font-medium">Gate Code:</span> {access.gateCode}</p>}
                {access.hazards && <p className="text-sm mt-2 text-destructive"><span className="font-medium">Hazards:</span> {access.hazards}</p>}
                {access.notes && <p className="text-sm mt-2 text-muted-foreground">{access.notes}</p>}
                {access.contactName && <p className="text-xs text-muted-foreground mt-3">Contact: {access.contactName} · {access.contactPhone}</p>}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b mb-6">
          <div className="flex gap-0 overflow-x-auto -mb-px">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn("flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  activeTab === tab.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}>
                <tab.icon size={15} />
                {tab.label}
                {tab.id === "messages" && fieldThreads.some(t => t.unreadCount > 0) && (
                  <span className="h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                    {fieldThreads.reduce((a, t) => a + t.unreadCount, 0)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === "overview" && <OverviewContent field={field} stats={stats} activeJob={activeJob} packet={packet} auditLogs={fieldAuditLogs} />}
        {activeTab === "jobs" && <JobsContent jobs={fieldJobs} />}
        {activeTab === "history" && <ActivityTimeline events={fieldAuditLogs} />}
        {activeTab === "files" && <FilesContent datasets={fieldDatasets} />}
        {activeTab === "financials" && <FinancialsContent stats={stats} invoices={fieldInvoices} />}
        {activeTab === "messages" && <MessagesContent threads={fieldThreads} />}
        {activeTab === "permissions" && <PermissionsContent permissions={fieldPermissions} />}
      </div>
    </AppShell>
  );
}

function InfoBlock({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-surface-2 p-2.5">
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5 text-sm font-medium">
        {icon}{typeof value === "string" ? <span className="truncate">{value}</span> : value}
      </div>
    </div>
  );
}

function OverviewContent({ field, stats, activeJob, packet, auditLogs }: any) {
  return (
    <div className="grid md:grid-cols-2 gap-5">
      {activeJob && (
        <div className="rounded-xl bg-card shadow-card p-5">
          <h3 className="font-semibold mb-3">Active Job</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Job</span><span className="font-medium">{activeJob.displayId} · {formatOperationType(activeJob.operationType)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Operator</span><span className="font-medium">{activeJob.operatorName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Window</span><span className="font-medium">{activeJob.scheduledStart ? `${formatDate(activeJob.scheduledStart)} – ${formatDate(activeJob.scheduledEnd!)}` : "TBD"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span className="font-medium tabular">{formatCurrency(activeJob.baseRate)}/{formatPricingModel(activeJob.pricingModel).toLowerCase().replace("per ", "")}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Estimated Total</span><span className="font-bold tabular">{formatCurrency(activeJob.estimatedTotal)}</span></div>
            {activeJob.splitPayment && <div className="flex items-center gap-1 text-xs text-info"><DollarSign size={12} /> Split payment active</div>}
          </div>
          <Button size="sm" variant="outline" className="w-full mt-4" asChild>
            <Link to={`/jobs/${activeJob.id}`}>View Job Details</Link>
          </Button>
        </div>
      )}

      {packet && <FieldPacketCard packet={packet} />}

      {stats && (
        <div className="rounded-xl bg-card shadow-card p-5">
          <h3 className="font-semibold mb-3">Season Summary</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 rounded-lg bg-surface-2"><p className="text-xl font-bold tabular">{stats.totalJobs}</p><p className="text-xs text-muted-foreground mt-0.5">Total Jobs</p></div>
            <div className="text-center p-3 rounded-lg bg-surface-2"><p className="text-xl font-bold tabular">{formatCurrency(stats.totalSpend)}</p><p className="text-xs text-muted-foreground mt-0.5">Total Spend</p></div>
            <div className="text-center p-3 rounded-lg bg-surface-2"><p className="text-xl font-bold tabular">{stats.operatorsUsed}</p><p className="text-xs text-muted-foreground mt-0.5">Operators Used</p></div>
            <div className="text-center p-3 rounded-lg bg-surface-2"><p className="text-xl font-bold tabular">{stats.filesUploaded}</p><p className="text-xs text-muted-foreground mt-0.5">Files Uploaded</p></div>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-card shadow-card p-5">
        <h3 className="font-semibold mb-3">Recent Activity</h3>
        <ActivityTimeline events={auditLogs} maxItems={6} />
      </div>
    </div>
  );
}

function JobsContent({ jobs: fieldJobs }: { jobs: any[] }) {
  return (
    <div className="rounded-xl bg-card shadow-card">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">All Jobs ({fieldJobs.length})</h3>
        <Button size="sm"><Plus size={14} /> Create Job</Button>
      </div>
      <div className="divide-y">
        {fieldJobs.map(job => (
          <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center justify-between p-4 hover:bg-surface-2 transition-colors">
            <div>
              <p className="text-sm font-medium">{job.displayId} · {formatOperationType(job.operationType)}</p>
              <p className="text-xs text-muted-foreground">{job.operatorName || "Unassigned"} · {job.scheduledStart ? formatDate(job.scheduledStart) : "Unscheduled"}</p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              {job.splitPayment && <span className="text-[10px] text-info font-medium bg-info/8 px-1.5 py-0.5 rounded">Split</span>}
              <span className="text-sm font-medium tabular">{formatCurrency(job.estimatedTotal)}</span>
              <StatusBadge status={job.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FilesContent({ datasets }: { datasets: any[] }) {
  return (
    <div className="rounded-xl bg-card shadow-card">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Files & Maps ({datasets.length})</h3>
        <Button variant="outline" size="sm"><Upload size={14} /> Upload</Button>
      </div>
      <div className="divide-y">
        {datasets.map(ds => (
          <FileRow key={ds.id} fileName={ds.fileName} category={ds.category} fileSize={ds.fileSize} version={ds.version} uploadedBy={ds.uploadedByName} cropYear={ds.cropYear} linkedJob={ds.jobId} date={ds.createdAt} />
        ))}
      </div>
    </div>
  );
}

function FinancialsContent({ stats, invoices }: { stats: any; invoices: any[] }) {
  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-card shadow-card p-5 text-center"><p className="text-xs text-muted-foreground uppercase tracking-wider">Total Spend</p><p className="text-2xl font-bold tabular mt-1">{formatCurrency(stats.totalSpend)}</p></div>
          <div className="rounded-xl bg-card shadow-card p-5 text-center"><p className="text-xs text-muted-foreground uppercase tracking-wider">Total Paid</p><p className="text-2xl font-bold tabular mt-1 text-success">{formatCurrency(stats.totalPaid)}</p></div>
          <div className="rounded-xl bg-card shadow-card p-5 text-center"><p className="text-xs text-muted-foreground uppercase tracking-wider">Outstanding</p><p className="text-2xl font-bold tabular mt-1 text-warning">{formatCurrency(stats.totalOutstanding)}</p></div>
        </div>
      )}
      <div className="rounded-xl bg-card shadow-card">
        <div className="p-4 border-b"><h3 className="font-semibold">Invoices</h3></div>
        <div className="divide-y">
          {invoices.map((inv: any) => (
            <div key={inv.id} className="flex items-center justify-between p-4">
              <div><p className="text-sm font-medium">{inv.displayId}</p><p className="text-xs text-muted-foreground">{formatDate(inv.createdAt)} · Due {formatDate(inv.dueDate)}</p></div>
              <div className="flex items-center gap-4"><span className="text-sm font-semibold tabular">{formatCurrency(inv.total)}</span><StatusBadge status={inv.status} /></div>
            </div>
          ))}
          {invoices.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No invoices for this field yet.</div>}
        </div>
      </div>
    </div>
  );
}

function MessagesContent({ threads }: { threads: any[] }) {
  const [selectedThread, setSelectedThread] = useState<string | null>(threads[0]?.id || null);
  const thread = threads.find((t: any) => t.id === selectedThread);
  const threadMessages = thread ? getMessagesByThread(thread.id) : [];

  return (
    <div className="rounded-xl bg-card shadow-card overflow-hidden">
      <div className="grid md:grid-cols-3 min-h-[400px]">
        <div className="border-r divide-y">
          {threads.map((t: any) => (
            <button key={t.id} onClick={() => setSelectedThread(t.id)}
              className={cn("w-full text-left p-3 hover:bg-surface-2 transition-colors", selectedThread === t.id && "bg-surface-2")}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate">{t.subject}</p>
                {t.unreadCount > 0 && <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">{t.unreadCount}</span>}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{t.lastMessagePreview}</p>
            </button>
          ))}
          {threads.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No messages yet.</div>}
        </div>
        <div className="md:col-span-2 flex flex-col">
          {thread ? (
            <>
              <div className="p-3 border-b"><h4 className="text-sm font-semibold">{thread.subject}</h4><p className="text-xs text-muted-foreground">{thread.participants.map((p: any) => p.userName).join(", ")}</p></div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {threadMessages.map((m: any) => (
                  <div key={m.id} className={cn("max-w-[80%]", m.senderId === "usr-1" ? "ml-auto" : "")}>
                    <div className={cn("rounded-lg p-3 text-sm", m.senderId === "usr-1" ? "bg-primary text-primary-foreground" : "bg-surface-2")}>
                      {m.content}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{m.senderName} · {formatDate(m.createdAt)}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t flex gap-2">
                <Button variant="ghost" size="icon" className="shrink-0"><Paperclip size={16} /></Button>
                <input type="text" placeholder="Type a message…" className="flex-1 bg-surface-2 rounded-lg px-3 py-2 text-sm outline-none" />
                <Button size="icon" className="shrink-0"><Send size={16} /></Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Select a conversation</div>
          )}
        </div>
      </div>
    </div>
  );
}

function PermissionsContent({ permissions }: { permissions: any[] }) {
  const levelLabels: Record<string, string> = { view: "View", order_work: "Order Work", upload_files: "Upload Files", approve_payment: "Approve Payment", manage: "Manage", admin: "Admin" };

  return (
    <div className="rounded-xl bg-card shadow-card">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Access Grants ({permissions.length})</h3>
        <Button variant="outline" size="sm"><Plus size={14} /> Grant Access</Button>
      </div>
      <div className="divide-y">
        {permissions.map((p: any) => (
          <div key={p.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{p.userName.split(" ").map((w: string) => w[0]).join("")}</div>
              <div><p className="text-sm font-medium">{p.userName}</p><p className="text-xs text-muted-foreground capitalize">{p.userRole.replace("_", " ")} · Granted by {p.grantedByName}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium bg-primary/8 text-primary px-2 py-0.5 rounded-full">{levelLabels[p.level] || p.level}</span>
              {p.expiresAt && <span className="text-xs text-muted-foreground">Expires {formatDate(p.expiresAt)}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
