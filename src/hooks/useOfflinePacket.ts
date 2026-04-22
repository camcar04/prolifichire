import { useCallback, useEffect, useState } from "react";
import {
  isPacketSavedOffline,
  removePacketOffline,
  savePacketOffline,
  subscribeOfflineChanges,
  getOfflinePacket,
  type OfflinePacketSnapshot,
  type SavePacketInput,
} from "@/lib/offlinePackets";

/**
 * React binding for offline packet storage. Tracks whether a packet is
 * currently saved on the device and exposes save/remove actions that keep
 * every mounted card in sync via the underlying change event.
 */
export function useOfflinePacket(packetId: string | undefined) {
  const [saved, setSaved] = useState<boolean>(() =>
    packetId ? isPacketSavedOffline(packetId) : false,
  );
  const [snapshot, setSnapshot] = useState<OfflinePacketSnapshot | null>(() =>
    packetId ? getOfflinePacket(packetId) : null,
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!packetId) return;
    const refresh = () => {
      setSaved(isPacketSavedOffline(packetId));
      setSnapshot(getOfflinePacket(packetId));
    };
    refresh();
    return subscribeOfflineChanges(refresh);
  }, [packetId]);

  const save = useCallback(
    async (input: Omit<SavePacketInput, "packetId">) => {
      if (!packetId) return null;
      setBusy(true);
      try {
        return await savePacketOffline({ packetId, ...input });
      } finally {
        setBusy(false);
      }
    },
    [packetId],
  );

  const remove = useCallback(async () => {
    if (!packetId) return;
    setBusy(true);
    try {
      await removePacketOffline(packetId);
    } finally {
      setBusy(false);
    }
  }, [packetId]);

  return { saved, snapshot, busy, save, remove };
}
