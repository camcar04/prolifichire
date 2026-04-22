import { Button } from "@/components/ui/button";
import { CloudDownload, CloudOff, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useOfflinePacket } from "@/hooks/useOfflinePacket";
import { formatRelative } from "@/lib/format";
import type { SavePacketInput } from "@/lib/offlinePackets";

interface OfflinePacketControlsProps {
  packetId: string;
  /** Builds the snapshot payload at click time so callers can pull fresh data. */
  buildPayload: () => Omit<SavePacketInput, "packetId">;
  /** Compact button uses an icon-only style for tight rows. */
  size?: "default" | "sm" | "compact";
  className?: string;
  /** When true, the badge is hidden (use when you render OfflineStatusBadge separately). */
  hideBadge?: boolean;
}

export function OfflinePacketControls({
  packetId,
  buildPayload,
  size = "default",
  className,
  hideBadge,
}: OfflinePacketControlsProps) {
  const { saved, busy, save, remove } = useOfflinePacket(packetId);

  const onSave = async () => {
    try {
      await save(buildPayload());
      toast.success("Packet saved — accessible without internet", {
        description: "Boundary, access instructions, and prescription files are stored on this device.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not save packet for offline use";
      toast.error(msg);
    }
  };

  const onRemove = async () => {
    await remove();
    toast("Removed offline copy");
  };

  if (size === "compact") {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        {!hideBadge && <OfflineStatusBadge packetId={packetId} compact />}
        <Button
          size="sm"
          variant={saved ? "outline" : "default"}
          className="h-7 text-[10px] gap-1 px-2"
          onClick={saved ? onRemove : onSave}
          disabled={busy}
          title={saved ? "Remove offline copy" : "Save packet to this device for offline access"}
        >
          {busy ? <Loader2 size={10} className="animate-spin" /> :
            saved ? <CloudOff size={10} /> : <CloudDownload size={10} />}
          {saved ? "Saved" : "Save Offline"}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {!hideBadge && <OfflineStatusBadge packetId={packetId} />}
      <Button
        size={size === "sm" ? "sm" : "default"}
        variant={saved ? "outline" : "default"}
        className="gap-1.5"
        onClick={saved ? onRemove : onSave}
        disabled={busy}
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> :
          saved ? <CloudOff size={14} /> : <CloudDownload size={14} />}
        {saved ? "Remove Offline Copy" : "Save for Offline"}
      </Button>
    </div>
  );
}

export function OfflineStatusBadge({
  packetId,
  compact,
  className,
}: {
  packetId: string;
  compact?: boolean;
  className?: string;
}) {
  const { saved, snapshot } = useOfflinePacket(packetId);

  if (saved) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-success/10 text-success font-medium border border-success/20",
          compact ? "text-[9px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5",
          className,
        )}
        title={snapshot ? `Saved ${formatRelative(snapshot.savedAt)}` : "Saved offline"}
      >
        <CheckCircle2 size={compact ? 9 : 11} />
        Saved Offline
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-warning/10 text-warning font-medium border border-warning/20",
        compact ? "text-[9px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5",
        className,
      )}
      title="This packet is not yet available without an internet connection"
    >
      <AlertTriangle size={compact ? 9 : 11} />
      Not saved offline
    </span>
  );
}
