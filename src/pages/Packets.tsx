import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/PageSkeleton";
import { Link } from "react-router-dom";
import { Package, MapPin, FileText, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { formatOperationType, formatAcres, formatRelative } from "@/lib/format";

export default function Packets() {
  const { user } = useAuth();

  // Get packets assigned to this operator
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

  // Also get accepted/in-progress jobs that don't have packets yet
  const { data: jobsWithoutPackets = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["operator-jobs-no-packet", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: jobs, error } = await supabase
        .from("jobs")
        .select(`
          id, display_id, operation_type, title, status, total_acres, scheduled_start, deadline,
          job_fields(fields(name, crop, acreage))
        `)
        .eq("operator_id", user!.id)
        .in("status", ["accepted", "scheduled", "in_progress"]);
      if (error) throw error;

      // Filter out jobs that already have packets
      const jobIdsWithPackets = new Set(packets.map((p: any) => p.job_id));
      return (jobs || []).filter((j: any) => !jobIdsWithPackets.has(j.id));
    },
  });

  const isLoading = packetsLoading || jobsLoading;

  const allItems = [
    ...jobsWithoutPackets.map((j: any) => ({
      type: "pending_packet" as const,
      id: j.id,
      job: j,
      packet: null,
    })),
    ...packets.map((p: any) => ({
      type: "packet" as const,
      id: p.id,
      job: p.jobs,
      packet: p,
    })),
  ];

  return (
    <AppShell title="Field Packets">
      <div className="animate-fade-in max-w-3xl">
        {isLoading ? (
          <ListSkeleton rows={3} />
        ) : allItems.length === 0 ? (
          <EmptyState
            icon={<Package size={24} />}
            title="No field packets yet"
            description="Accept a job to receive your first field packet. Packets contain field data, maps, and instructions needed to execute work."
            action={{ label: "Browse Available Jobs", to: "/marketplace" }}
          />
        ) : (
          <div className="space-y-2">
            {/* Pending packets — jobs accepted but no packet generated */}
            {jobsWithoutPackets.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Awaiting Packet Generation
                </p>
                {jobsWithoutPackets.map((job: any) => {
                  const fieldName = job.job_fields?.[0]?.fields?.name;
                  return (
                    <Link
                      key={job.id}
                      to={`/jobs/${job.id}`}
                      className="flex items-center gap-3 rounded-lg bg-card border border-dashed border-warning/40 p-3 mb-2 hover:bg-surface-2 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-md bg-warning/10 flex items-center justify-center shrink-0">
                        <AlertTriangle size={14} className="text-warning" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate">
                          {job.display_id} · {formatOperationType(job.operation_type)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {fieldName || job.title} · {formatAcres(Number(job.total_acres))} · Waiting for field data
                        </p>
                      </div>
                      <StatusBadge status="draft" />
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Existing packets */}
            {packets.length > 0 && (
              <div>
                {jobsWithoutPackets.length > 0 && (
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Your Packets
                  </p>
                )}
                <div className="space-y-2">
                  {packets.map((p: any) => {
                    const job = p.jobs;
                    const fieldName = job?.job_fields?.[0]?.fields?.name;
                    const fileCount = p.field_packet_files?.filter((f: any) => f.included)?.length || 0;
                    const missingCount = p.missing_required?.length || 0;
                    const isReady = p.status === "ready" || p.status === "approved";

                    return (
                      <Link
                        key={p.id}
                        to={`/jobs/${p.job_id}`}
                        className="flex items-center gap-3 rounded-lg bg-card border p-3 hover:bg-surface-2 transition-colors"
                      >
                        <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${isReady ? "bg-success/10" : "bg-primary/10"}`}>
                          {isReady ? <CheckCircle2 size={14} className="text-success" /> : <Package size={14} className="text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-medium truncate">
                              {job?.display_id} · {job ? formatOperationType(job.operation_type) : ""}
                            </p>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {fieldName || job?.title} · {fileCount} file{fileCount !== 1 ? "s" : ""}
                            {missingCount > 0 && (
                              <span className="text-destructive"> · {missingCount} missing</span>
                            )}
                            {p.download_count > 0 && ` · ${p.download_count} downloads`}
                          </p>
                          {missingCount > 0 && (
                            <p className="text-[10px] text-destructive mt-0.5 flex items-center gap-1">
                              <AlertTriangle size={9} /> Missing: {p.missing_required.slice(0, 2).join(", ")}
                              {missingCount > 2 && ` +${missingCount - 2} more`}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge status={p.status} />
                          <ChevronRight size={14} className="text-muted-foreground" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
