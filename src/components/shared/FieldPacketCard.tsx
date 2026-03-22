import { cn } from "@/lib/utils";
import type { FieldPacket } from "@/types/domain";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatFileSize } from "@/lib/format";
import { getCategoryLabel } from "@/components/shared/FileRow";
import { Button } from "@/components/ui/button";
import { Download, Package, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface FieldPacketCardProps {
  packet: FieldPacket;
  className?: string;
}

export function FieldPacketCard({ packet, className }: FieldPacketCardProps) {
  const totalSize = packet.files.filter(f => f.included).reduce((s, f) => s + f.fileSize, 0);
  const includedCount = packet.files.filter(f => f.included).length;

  return (
    <div className={cn("rounded-xl bg-card shadow-card", className)}>
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package size={20} className="text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">Field Packet v{packet.version}</h3>
              <StatusBadge status={packet.status} />
            </div>
            <p className="text-xs text-muted-foreground">{includedCount} files · {formatFileSize(totalSize)}</p>
          </div>
        </div>
        <Button size="sm" disabled={packet.status === "generating"}>
          <Download size={14} /> Download
        </Button>
      </div>

      {/* Missing data alerts */}
      {packet.missingRequired.length > 0 && (
        <div className="px-4 py-3 border-b bg-destructive/5">
          {packet.missingRequired.map((msg, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <AlertTriangle size={14} className="text-destructive mt-0.5 shrink-0" />
              <span className="text-destructive">{msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* File list */}
      <div className="divide-y">
        {packet.files.map(file => (
          <div key={file.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              {file.included ? (
                <CheckCircle2 size={14} className="text-success shrink-0" />
              ) : (
                <AlertTriangle size={14} className="text-destructive shrink-0" />
              )}
              <span className={cn("truncate", !file.included && "text-muted-foreground line-through")}>
                {file.fileName || `Missing: ${getCategoryLabel(file.category)}`}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
              <span>{getCategoryLabel(file.category)}</span>
              {file.required && <span className="text-destructive font-medium">Required</span>}
              {file.fileSize > 0 && <span>{formatFileSize(file.fileSize)}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t bg-surface-2 rounded-b-xl flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Generated {formatDateTime(packet.generatedAt)}</span>
          {packet.approvedForExecution && (
            <span className="flex items-center gap-1 text-success font-medium">
              <CheckCircle2 size={12} /> Approved for execution
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>{packet.downloadCount} downloads</span>
        </div>
      </div>
    </div>
  );
}
