import { useState, useEffect, useCallback, useRef } from "react";

export interface QueuedAction {
  id: string;
  type: "job_start" | "job_complete" | "proof_upload" | "note_add" | "photo_upload" | "status_update";
  payload: Record<string, unknown>;
  createdAt: string;
  status: "queued" | "syncing" | "synced" | "failed";
  retryCount: number;
  error?: string;
}

interface OfflineSyncState {
  isOnline: boolean;
  lastSyncedAt: string | null;
  queuedActions: QueuedAction[];
  syncInProgress: boolean;
  syncProgress: number; // 0-100
}

const STORAGE_KEY = "ph_offline_queue";
const SYNC_KEY = "ph_last_sync";

function loadQueue(): QueuedAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedAction[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function useOfflineSync() {
  const [state, setState] = useState<OfflineSyncState>({
    isOnline: navigator.onLine,
    lastSyncedAt: localStorage.getItem(SYNC_KEY),
    queuedActions: loadQueue(),
    syncInProgress: false,
    syncProgress: 0,
  });
  const syncingRef = useRef(false);

  // Online/offline detection
  useEffect(() => {
    const goOnline = () => setState(s => ({ ...s, isOnline: true }));
    const goOffline = () => setState(s => ({ ...s, isOnline: false }));
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (state.isOnline && state.queuedActions.some(a => a.status === "queued")) {
      syncQueue();
    }
  }, [state.isOnline]);

  const enqueueAction = useCallback((type: QueuedAction["type"], payload: Record<string, unknown>) => {
    const action: QueuedAction = {
      id: crypto.randomUUID(),
      type,
      payload,
      createdAt: new Date().toISOString(),
      status: "queued",
      retryCount: 0,
    };
    setState(s => {
      const updated = [...s.queuedActions, action];
      saveQueue(updated);
      return { ...s, queuedActions: updated };
    });
    return action.id;
  }, []);

  const syncQueue = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;
    setState(s => ({ ...s, syncInProgress: true, syncProgress: 0 }));

    const queue = loadQueue().filter(a => a.status === "queued" || a.status === "failed");
    const total = queue.length;

    for (let i = 0; i < queue.length; i++) {
      const action = queue[i];
      setState(s => ({
        ...s,
        syncProgress: Math.round(((i + 1) / total) * 100),
        queuedActions: s.queuedActions.map(a =>
          a.id === action.id ? { ...a, status: "syncing" as const } : a
        ),
      }));

      try {
        // Simulate sync — in production, this would call Supabase
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
        
        setState(s => ({
          ...s,
          queuedActions: s.queuedActions.map(a =>
            a.id === action.id ? { ...a, status: "synced" as const } : a
          ),
        }));
      } catch (err) {
        setState(s => ({
          ...s,
          queuedActions: s.queuedActions.map(a =>
            a.id === action.id
              ? { ...a, status: "failed" as const, retryCount: a.retryCount + 1, error: String(err) }
              : a
          ),
        }));
      }
    }

    const now = new Date().toISOString();
    localStorage.setItem(SYNC_KEY, now);

    // Clean synced items
    setState(s => {
      const remaining = s.queuedActions.filter(a => a.status !== "synced");
      saveQueue(remaining);
      return { ...s, syncInProgress: false, syncProgress: 100, lastSyncedAt: now, queuedActions: remaining };
    });
    syncingRef.current = false;
  }, []);

  const clearSynced = useCallback(() => {
    setState(s => {
      const remaining = s.queuedActions.filter(a => a.status !== "synced");
      saveQueue(remaining);
      return { ...s, queuedActions: remaining };
    });
  }, []);

  return {
    ...state,
    enqueueAction,
    syncQueue,
    clearSynced,
    pendingCount: state.queuedActions.filter(a => a.status === "queued" || a.status === "failed").length,
  };
}

// Cached data storage for offline access
const CACHE_PREFIX = "ph_cache_";

export function cacheData(key: string, data: unknown) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
      data,
      cachedAt: new Date().toISOString(),
    }));
  } catch {
    // Storage full — silently fail
  }
}

export function getCachedData<T>(key: string): { data: T; cachedAt: string } | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
