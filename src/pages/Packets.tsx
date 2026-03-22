import AppShell from "@/components/layout/AppShell";
import { FieldPacketCard } from "@/components/shared/FieldPacketCard";
import { fieldPackets, jobs } from "@/data/mock";
import { Package } from "lucide-react";
import { formatOperationType } from "@/lib/format";

const OPERATOR_ID = "usr-3";
const myPackets = fieldPackets.filter(p => p.operatorId === OPERATOR_ID);

export default function Packets() {
  return (
    <AppShell title="Field Packets">
      <div className="animate-fade-in max-w-3xl">
        {myPackets.length === 0 ? (
          <div className="rounded-xl bg-card shadow-card p-12 text-center">
            <Package size={32} className="mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="font-semibold mb-1">No field packets</h3>
            <p className="text-sm text-muted-foreground">Packets are generated when you're assigned to a job.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myPackets.map(p => {
              const job = jobs.find(j => j.id === p.jobId);
              return (
                <div key={p.id}>
                  {job && (
                    <p className="text-xs text-muted-foreground mb-1.5 font-medium">
                      {job.displayId} · {formatOperationType(job.operationType)} · {job.fields[0]?.fieldName}
                    </p>
                  )}
                  <FieldPacketCard packet={p} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
