import { useOfflineSync } from "@/hooks/useOfflineSync";
import { cn } from "@/lib/utils";
import { WifiOff, RefreshCw, CloudOff, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";

export function OfflineBanner() {
  const { isOnline, lastSyncedAt, pendingCount, syncInProgress, syncProgress, syncQueue } = useOfflineSync();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={cn(
      "flex items-center justify-between gap-3 px-4 py-2 text-sm border-b transition-colors",
      !isOnline
        ? "bg-warning/10 border-warning/20 text-warning"
        : "bg-info/10 border-info/20 text-info"
    )}>
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff size={14} />
            <span className="font-medium">Offline</span>
            {lastSyncedAt && (
              <span className="text-xs opacity-70">
                · Last synced {formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}
              </span>
            )}
          </>
        ) : (
          <>
            <CloudOff size={14} />
            <span className="font-medium">{pendingCount} action{pendingCount !== 1 ? "s" : ""} pending sync</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {syncInProgress ? (
          <div className="flex items-center gap-2 min-w-[120px]">
            <Progress value={syncProgress} className="h-1.5 flex-1" />
            <span className="text-xs tabular">{syncProgress}%</span>
          </div>
        ) : isOnline && pendingCount > 0 ? (
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={syncQueue}>
            <RefreshCw size={12} /> Sync Now
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function SyncStatusIndicator() {
  const { isOnline, pendingCount, syncInProgress, lastSyncedAt } = useOfflineSync();

  return (
    <div className="flex items-center gap-1.5">
      <div className={cn(
        "h-2 w-2 rounded-full",
        !isOnline ? "bg-warning" : syncInProgress ? "bg-info animate-pulse" : "bg-success"
      )} />
      <span className="text-[11px] text-muted-foreground">
        {!isOnline
          ? "Offline"
          : syncInProgress
          ? "Syncing..."
          : pendingCount > 0
          ? `${pendingCount} pending`
          : "Connected"
        }
      </span>
    </div>
  );
}

export function QueuedActionsPanel() {
  const { queuedActions, syncQueue, isOnline, syncInProgress } = useOfflineSync();

  if (queuedActions.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        <Check size={24} className="mx-auto mb-2 text-success/50" />
        <p>All actions synced</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{queuedActions.length} Queued Action{queuedActions.length !== 1 ? "s" : ""}</h3>
        {isOnline && !syncInProgress && (
          <Button size="sm" variant="outline" onClick={syncQueue}>
            <RefreshCw size={13} /> Sync All
          </Button>
        )}
      </div>
      <div className="divide-y rounded-lg border overflow-hidden">
        {queuedActions.map(a => (
          <div key={a.id} className="flex items-center gap-3 p-3 text-sm">
            <div className={cn(
              "h-2 w-2 rounded-full shrink-0",
              a.status === "synced" ? "bg-success" :
              a.status === "failed" ? "bg-destructive" :
              a.status === "syncing" ? "bg-info animate-pulse" :
              "bg-muted-foreground"
            )} />
            <div className="flex-1 min-w-0">
              <p className="font-medium capitalize">{a.type.replace(/_/g, " ")}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                {a.error && <span className="text-destructive"> · {a.error}</span>}
              </p>
            </div>
            {a.status === "failed" && (
              <AlertCircle size={14} className="text-destructive shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
