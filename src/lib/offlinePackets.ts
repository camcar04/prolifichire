/**
 * Offline packet storage for field operators working in low/no-signal areas.
 *
 * Strategy:
 *   - Metadata + textual data (boundary GeoJSON, access instructions, file index)
 *     is stored as JSON in localStorage under one key per packet.
 *   - Binary prescription / map files are saved into the Cache API so the browser
 *     can serve them without a network round trip.
 *   - A custom DOM event lets every mounted card re-render when the saved set
 *     changes, without needing a global store.
 */

const STORAGE_PREFIX = "ph:offline_packet:";
const INDEX_KEY = "ph:offline_packet_index";
const CACHE_NAME = "ph-offline-packets-v1";
const CHANGE_EVENT = "ph:offline-packets-changed";

export interface OfflinePacketSnapshot {
  packetId: string;
  jobId: string;
  jobDisplayId?: string | null;
  fieldName?: string | null;
  savedAt: string; // ISO
  boundaryGeoJSON?: unknown;
  accessInstructions?: {
    directions?: string | null;
    gateCode?: string | null;
    hazards?: string | null;
    contactName?: string | null;
    contactPhone?: string | null;
    notes?: string | null;
  } | null;
  files: Array<{
    name: string;
    category?: string | null;
    storagePath?: string | null;
    cachedUrl?: string | null;
    sizeBytes?: number | null;
  }>;
}

function emitChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function subscribeOfflineChanges(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

export function getOfflinePacket(packetId: string): OfflinePacketSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + packetId);
    return raw ? (JSON.parse(raw) as OfflinePacketSnapshot) : null;
  } catch {
    return null;
  }
}

export function isPacketSavedOffline(packetId: string): boolean {
  try {
    return localStorage.getItem(STORAGE_PREFIX + packetId) !== null;
  } catch {
    return false;
  }
}

export function listOfflinePacketIds(): string[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function updateIndex(packetId: string, present: boolean) {
  const current = new Set(listOfflinePacketIds());
  if (present) current.add(packetId);
  else current.delete(packetId);
  localStorage.setItem(INDEX_KEY, JSON.stringify([...current]));
}

/** Triggers a browser download of a Blob with the given filename. */
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildAccessInstructionsText(
  snapshot: OfflinePacketSnapshot,
): string {
  const lines: string[] = [];
  lines.push(`FIELD PACKET — ${snapshot.jobDisplayId || snapshot.packetId}`);
  if (snapshot.fieldName) lines.push(`Field: ${snapshot.fieldName}`);
  lines.push(`Saved: ${new Date(snapshot.savedAt).toLocaleString()}`);
  lines.push("");
  const ai = snapshot.accessInstructions;
  if (ai) {
    if (ai.gateCode) lines.push(`GATE CODE: ${ai.gateCode}`);
    if (ai.directions) lines.push("", "DIRECTIONS:", ai.directions);
    if (ai.hazards) lines.push("", "HAZARDS:", ai.hazards);
    if (ai.contactName || ai.contactPhone) {
      lines.push("", `CONTACT: ${ai.contactName || ""}${ai.contactPhone ? " · " + ai.contactPhone : ""}`);
    }
    if (ai.notes) lines.push("", "NOTES:", ai.notes);
  } else {
    lines.push("(No access instructions provided)");
  }
  return lines.join("\n");
}

export interface SavePacketInput {
  packetId: string;
  jobId: string;
  jobDisplayId?: string | null;
  fieldName?: string | null;
  boundaryGeoJSON?: unknown;
  accessInstructions?: OfflinePacketSnapshot["accessInstructions"];
  files: Array<{
    name: string;
    category?: string | null;
    storagePath?: string | null;
    /** Optional pre-signed URL — when present we cache the response. */
    downloadUrl?: string | null;
    sizeBytes?: number | null;
  }>;
  /** When true (default), trigger browser downloads of the boundary and instructions. */
  triggerBrowserDownload?: boolean;
}

/**
 * Persist a packet snapshot for offline access.
 * Returns the snapshot that was stored.
 */
export async function savePacketOffline(
  input: SavePacketInput,
): Promise<OfflinePacketSnapshot> {
  const triggerBrowser = input.triggerBrowserDownload !== false;
  const cachedFiles: OfflinePacketSnapshot["files"] = [];

  // Cache binary file URLs when provided. We swallow individual failures so the
  // overall save still succeeds — the snapshot will note which files cached.
  if ("caches" in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      for (const f of input.files) {
        let cachedUrl: string | null = null;
        if (f.downloadUrl) {
          try {
            const resp = await fetch(f.downloadUrl);
            if (resp.ok) {
              await cache.put(f.downloadUrl, resp.clone());
              cachedUrl = f.downloadUrl;
            }
          } catch {
            cachedUrl = null;
          }
        }
        cachedFiles.push({
          name: f.name,
          category: f.category ?? null,
          storagePath: f.storagePath ?? null,
          cachedUrl,
          sizeBytes: f.sizeBytes ?? null,
        });
      }
    } catch {
      // Cache API unavailable — fall through to metadata-only save.
      for (const f of input.files) {
        cachedFiles.push({
          name: f.name,
          category: f.category ?? null,
          storagePath: f.storagePath ?? null,
          cachedUrl: null,
          sizeBytes: f.sizeBytes ?? null,
        });
      }
    }
  } else {
    for (const f of input.files) {
      cachedFiles.push({
        name: f.name,
        category: f.category ?? null,
        storagePath: f.storagePath ?? null,
        cachedUrl: null,
        sizeBytes: f.sizeBytes ?? null,
      });
    }
  }

  const snapshot: OfflinePacketSnapshot = {
    packetId: input.packetId,
    jobId: input.jobId,
    jobDisplayId: input.jobDisplayId ?? null,
    fieldName: input.fieldName ?? null,
    savedAt: new Date().toISOString(),
    boundaryGeoJSON: input.boundaryGeoJSON,
    accessInstructions: input.accessInstructions ?? null,
    files: cachedFiles,
  };

  localStorage.setItem(STORAGE_PREFIX + input.packetId, JSON.stringify(snapshot));
  updateIndex(input.packetId, true);
  emitChange();

  // Trigger browser downloads so the operator gets local copies they can open
  // even outside the app (e.g. from their downloads folder in the cab).
  if (triggerBrowser) {
    const baseName = (input.jobDisplayId || input.packetId).replace(/[^a-z0-9_-]+/gi, "_");

    if (input.boundaryGeoJSON) {
      const boundaryBlob = new Blob([JSON.stringify(input.boundaryGeoJSON, null, 2)], {
        type: "application/geo+json",
      });
      triggerDownload(boundaryBlob, `${baseName}_boundary.geojson`);
    }

    const instructionsBlob = new Blob([buildAccessInstructionsText(snapshot)], {
      type: "text/plain",
    });
    triggerDownload(instructionsBlob, `${baseName}_access_instructions.txt`);
  }

  return snapshot;
}

export async function removePacketOffline(packetId: string): Promise<void> {
  const snapshot = getOfflinePacket(packetId);
  localStorage.removeItem(STORAGE_PREFIX + packetId);
  updateIndex(packetId, false);

  if (snapshot && "caches" in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        snapshot.files
          .filter(f => !!f.cachedUrl)
          .map(f => cache.delete(f.cachedUrl as string)),
      );
    } catch {
      // ignore — metadata removal already succeeded
    }
  }

  emitChange();
}
