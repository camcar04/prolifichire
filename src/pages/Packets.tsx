import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/PageSkeleton";
import { Package } from "lucide-react";
import { formatOperationType } from "@/lib/format";

export default function Packets() {
  const { user } = useAuth();

  const { data: packets = [], isLoading } = useQuery({
    queryKey: ["my-packets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("field_packets")
        .select(`
          *,
          field_packet_files(*),
          jobs(display_id, operation_type, title, job_fields(fields(name)))
        `)
        .eq("operator_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <AppShell title="Field Packets">
      <div className="animate-fade-in max-w-3xl">
        {isLoading ? (
          <ListSkeleton rows={3} />
        ) : packets.length === 0 ? (
          <EmptyState
            icon={<Package size={24} />}
            title="No field packets"
            description="Packets are generated when you're assigned to a job. Accept a job to receive your first packet."
            action={{ label: "Browse Available Jobs", to: "/marketplace" }}
          />
        ) : (
          <div className="space-y-4">
            {packets.map((p: any) => {
              const job = p.jobs;
              const fieldName = job?.job_fields?.[0]?.fields?.name;
              const fileCount = p.field_packet_files?.filter((f: any) => f.included)?.length || 0;
              return (
                <div key={p.id} className="rounded-xl bg-card shadow-card p-5">
                  {job && (
                    <p className="text-xs text-muted-foreground mb-2 font-medium">
                      {job.display_id} · {formatOperationType(job.operation_type)}{fieldName ? ` · ${fieldName}` : ""}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Packet v{p.version}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {fileCount} file{fileCount !== 1 ? "s" : ""} · {p.download_count || 0} download{p.download_count !== 1 ? "s" : ""}
                      </p>
                      {p.missing_required?.length > 0 && (
                        <p className="text-xs text-destructive mt-1">Missing: {p.missing_required.join(", ")}</p>
                      )}
                    </div>
                    <StatusBadge status={p.status} />
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
