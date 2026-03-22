import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Package, AlertTriangle, CheckCircle2, ChevronRight, MapPin, Clock, FileText, Store, RefreshCw, Loader2 } from "lucide-react";
import { formatOperationType, formatAcres, formatRelative, formatCropType } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PacketGroup = "ready" | "incomplete" | "in_progress" | "awaiting" | "completed";

const GROUP_ORDER: PacketGroup[] = ["in_progress", "ready", "incomplete", "awaiting", "completed"];
const GROUP_LABELS: Record<PacketGroup, string> = {
  in_progress: "In Progress",
  ready: "Ready for Execution",
  incomplete: "Incomplete — Missing Data",
  awaiting: "Awaiting Packet Generation",
  completed: "Completed",
};

export default function Packets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: packets = [], isLoading: packetsLoading } = useQuery({
    queryKey: ["my-packets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("field_packets")
        .select(`
          *,
          field_packet_files(*),
          jobs(id, display_id, operation_type, title, status, total_acres, scheduled_start, deadline,
            job_fields(fields(name, crop, acreage, centroid_lat, centroid_lng))
          )
        `)
        .eq("operator_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: jobsWithoutPackets = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["operator-jobs-no-packet", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: jobs, error } = await supabase
        .from("jobs")
        .select(`
          id, display_id, operation_type, title, status, total_acres, scheduled_start, deadline, urgency,
          job_fields(fields(id, name, crop, acreage, centroid_lat, centroid_lng))
        `)
        .eq("operator_id", user!.id)
        .in("status", ["accepted", "scheduled", "in_progress"]);
      if (error) throw error;

      const jobIdsWithPackets = new Set(packets.map((p: any) => p.job_id));
      return (jobs || []).filter((j: any) => !jobIdsWithPackets.has(j.id));
    },
  });

  // Auto-generate packet for jobs that don't have one
  const generatePacket = useMutation({
    mutationFn: async (job: any) => {
      const field = job.job_fields?.[0]?.fields;
      if (!field) throw new Error("No field linked to this job");
      const fieldId = job.job_fields[0].fields?.id || job.job_fields[0].field_id;
      
      // Get the actual field_id from job_fields
      const { data: jf } = await supabase
        .from("job_fields")
        .select("field_id")
        .eq("job_id", job.id)
        .limit(1)
        .single();
      
      if (!jf) throw new Error("No field linked to this job");

      const { error } = await supabase.from("field_packets").insert({
        job_id: job.id,
        field_id: jf.field_id,
        operator_id: user!.id,
        status: "pending" as any,
        version: 1,
        missing_required: [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-packets"] });
      queryClient.invalidateQueries({ queryKey: ["operator-jobs-no-packet"] });
      toast.success("Packet generated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const isLoading = packetsLoading || jobsLoading;

  // Group items
  const grouped: Record<PacketGroup, any[]> = {
    in_progress: [], ready: [], incomplete: [], awaiting: [], completed: [],
  };

  jobsWithoutPackets.forEach((j: any) => {
    grouped.awaiting.push({ type: "pending_packet", id: j.id, job: j, packet: null });
  });

  packets.forEach((p: any) => {
    const item = { type: "packet", id: p.id, job: p.jobs, packet: p };
    const jobStatus = p.jobs?.status;
    const packetStatus = p.status;
    const missingCount = p.missing_required?.length || 0;

    if (jobStatus === "completed" || packetStatus === "completed") {
      grouped.completed.push(item);
    } else if (jobStatus === "in_progress" || packetStatus === "in_progress") {
      grouped.in_progress.push(item);
    } else if (packetStatus === "ready" || packetStatus === "approved") {
      grouped.ready.push(item);
    } else if (missingCount > 0 || packetStatus === "pending" || packetStatus === "generating") {
      grouped.incomplete.push(item);
    } else {
      grouped.ready.push(item);
    }
  });

  const totalItems = Object.values(grouped).reduce((s, arr) => s + arr.length, 0);

  return (
    <AppShell title="Field Packets">
      <div className="animate-fade-in max-w-3xl">
        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : totalItems === 0 ? (
          <EmptyState
            icon={<Package size={24} />}
            title="No field packets yet"
            description="Accept a job from the marketplace to receive your first field packet. Packets contain field data, maps, and instructions needed to execute work."
            action={{ label: "Browse Available Jobs", to: "/marketplace" }}
          />
        ) : (
          <div className="space-y-5">
            {/* Summary strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "In Progress", count: grouped.in_progress.length, color: "text-success" },
                { label: "Ready", count: grouped.ready.length, color: "text-primary" },
                { label: "Incomplete", count: grouped.incomplete.length, color: "text-destructive" },
                { label: "Awaiting", count: grouped.awaiting.length, color: "text-warning" },
              ].map(s => (
                <div key={s.label} className="rounded-lg bg-card border p-3 text-center">
                  <p className={cn("text-lg font-bold tabular-nums", s.color)}>{s.count}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            {GROUP_ORDER.map(group => {
              const items = grouped[group];
              if (items.length === 0) return null;

              return (
                <div key={group}>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {GROUP_LABELS[group]} ({items.length})
                  </p>
                  <div className="space-y-1.5">
                    {items.map((item: any) => (
                      <PacketRow
                        key={item.id}
                        item={item}
                        group={group}
                        onGenerate={() => generatePacket.mutate(item.job)}
                        generating={generatePacket.isPending}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function PacketRow({ item, group, onGenerate, generating }: { item: any; group: PacketGroup; onGenerate: () => void; generating: boolean }) {
  const job = item.job;
  const packet = item.packet;
  const fieldName = job?.job_fields?.[0]?.fields?.name;
  const crop = job?.job_fields?.[0]?.fields?.crop;
  const fileCount = packet?.field_packet_files?.filter((f: any) => f.included)?.length || 0;
  const missingCount = packet?.missing_required?.length || 0;

  const borderClass = group === "in_progress" ? "border-success/30"
    : group === "ready" ? "border-primary/20"
    : group === "incomplete" ? "border-destructive/20"
    : group === "awaiting" ? "border-dashed border-warning/40"
    : "";

  const iconBg = group === "in_progress" ? "bg-success/10"
    : group === "ready" ? "bg-primary/10"
    : group === "incomplete" ? "bg-destructive/10"
    : group === "awaiting" ? "bg-warning/10"
    : "bg-muted";

  const Icon = group === "in_progress" ? CheckCircle2
    : group === "ready" ? Package
    : group === "incomplete" || group === "awaiting" ? AlertTriangle
    : FileText;

  const iconColor = group === "in_progress" ? "text-success"
    : group === "ready" ? "text-primary"
    : group === "incomplete" ? "text-destructive"
    : group === "awaiting" ? "text-warning"
    : "text-muted-foreground";

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-lg bg-card border p-3 transition-colors",
      borderClass
    )}>
      <div className={cn("h-8 w-8 rounded-md flex items-center justify-center shrink-0", iconBg)}>
        <Icon size={14} className={iconColor} />
      </div>
      <Link to={`/jobs/${job?.id || item.id}`} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-medium truncate">
            {job?.display_id} · {job ? formatOperationType(job.operation_type) : ""}
          </p>
          {job?.urgency && job.urgency !== "normal" && (
            <span className="text-[9px] font-bold text-destructive bg-destructive/10 px-1 py-0.5 rounded-full uppercase">{job.urgency}</span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {fieldName || job?.title}
          {crop && ` · ${formatCropType(crop)}`}
          {job?.total_acres && ` · ${formatAcres(Number(job.total_acres))}`}
        </p>
        {group === "awaiting" && (
          <p className="text-[10px] text-warning mt-0.5 flex items-center gap-1">
            <Clock size={9} /> Packet not yet generated — click to create
          </p>
        )}
        {group === "incomplete" && missingCount > 0 && (
          <p className="text-[10px] text-destructive mt-0.5 flex items-center gap-1">
            <AlertTriangle size={9} /> Missing: {packet.missing_required.slice(0, 2).join(", ")}
            {missingCount > 2 && ` +${missingCount - 2} more`}
          </p>
        )}
        {group === "ready" && (
          <p className="text-[10px] text-primary mt-0.5 flex items-center gap-1">
            <CheckCircle2 size={9} /> {fileCount} file{fileCount !== 1 ? "s" : ""} ready · Download available
          </p>
        )}
        {group === "in_progress" && (
          <p className="text-[10px] text-success mt-0.5 flex items-center gap-1">
            <MapPin size={9} /> Active execution
            {fileCount > 0 && ` · ${fileCount} files`}
          </p>
        )}
      </Link>
      <div className="flex items-center gap-2 shrink-0">
        {group === "awaiting" ? (
          <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={onGenerate} disabled={generating}>
            {generating ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
            Generate
          </Button>
        ) : (
          <>
            <StatusBadge status={packet?.status || job?.status} />
            <Link to={`/jobs/${job?.id || item.id}`}><ChevronRight size={14} className="text-muted-foreground" /></Link>
          </>
        )}
      </div>
    </div>
  );
}
