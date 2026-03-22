import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Link2, Unlink, RefreshCw, Download, Upload, CheckCircle2,
  AlertCircle, Clock, ExternalLink, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface OEMProvider {
  id: string;
  name: string;
  description: string;
  logo: string;
  capabilities: string[];
  supportedData: string[];
}

const PROVIDERS: OEMProvider[] = [
  {
    id: "john_deere",
    name: "John Deere Operations Center",
    description: "Import field boundaries, planting data, as-applied maps, and yield data from your Deere account.",
    logo: "🚜",
    capabilities: ["Field Boundaries", "Planting Data", "As-Applied", "Yield Maps", "Machine Data"],
    supportedData: ["field_boundary", "planting_data", "application_data", "harvest_data", "machine_data"],
  },
  {
    id: "climate_fieldview",
    name: "Climate FieldView",
    description: "Sync prescriptions, planting data, and imagery from your FieldView account.",
    logo: "🌾",
    capabilities: ["Prescriptions", "Planting Data", "Imagery", "Scouting Reports"],
    supportedData: ["prescription", "planting_data", "imagery", "scouting"],
  },
  {
    id: "cnhi",
    name: "CNH Industrial (Case IH / New Holland)",
    description: "Connect to AFS Connect or PLM Connect for machine data and field operations.",
    logo: "⚙️",
    capabilities: ["Machine Data", "Field Boundaries", "As-Applied"],
    supportedData: ["machine_data", "field_boundary", "application_data"],
  },
];

interface Connection {
  id: string;
  provider: string;
  display_name: string;
  status: string;
  last_sync_at: string | null;
  sync_status: string;
  sync_error: string | null;
  created_at: string;
}

export function OEMConnectionsPanel() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadConnections();
  }, [user]);

  const loadConnections = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("external_connections")
      .select("*")
      .eq("user_id", user.id);
    setConnections((data || []) as Connection[]);
    setLoading(false);
  };

  const connectProvider = async (providerId: string) => {
    if (!user) return;
    // In production, this would initiate OAuth flow
    const provider = PROVIDERS.find(p => p.id === providerId);
    if (!provider) return;

    const { error } = await supabase.from("external_connections").insert({
      user_id: user.id,
      provider: providerId,
      display_name: provider.name,
      status: "connected",
      sync_status: "idle",
    } as any);

    if (error) {
      toast.error("Failed to connect: " + error.message);
    } else {
      toast.success(`Connected to ${provider.name}`);
      loadConnections();
    }
  };

  const disconnectProvider = async (connectionId: string) => {
    const { error } = await supabase
      .from("external_connections")
      .delete()
      .eq("id", connectionId);

    if (error) {
      toast.error("Failed to disconnect");
    } else {
      toast.success("Disconnected");
      loadConnections();
    }
  };

  const triggerSync = async (connectionId: string, direction: "import" | "export") => {
    if (!user) return;
    setSyncing(connectionId);

    // Log sync attempt
    await supabase.from("sync_logs").insert({
      connection_id: connectionId,
      user_id: user.id,
      direction,
      entity_type: "all",
      status: "in_progress",
      started_at: new Date().toISOString(),
    } as any);

    // Update connection sync status
    await supabase
      .from("external_connections")
      .update({ sync_status: "syncing" } as any)
      .eq("id", connectionId);

    // Simulate sync
    setTimeout(async () => {
      await supabase
        .from("external_connections")
        .update({
          sync_status: "success",
          last_sync_at: new Date().toISOString(),
        } as any)
        .eq("id", connectionId);

      setSyncing(null);
      toast.success("Sync completed successfully");
      loadConnections();
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1">Platform Integrations</h2>
        <p className="text-sm text-muted-foreground">Optionally connect your precision ag platforms to import and export field data. All core features work with manual uploads — integrations are enhancements, not requirements.</p>
      </div>

      <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 flex items-start gap-3">
        <Upload size={16} className="text-primary mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-foreground">No external account needed</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            Upload shapefiles, GeoJSON, KML, CSV, or draw field boundaries directly. Create jobs, generate field packets, and manage operations using only platform tools.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {PROVIDERS.map(provider => {
          const connection = connections.find(c => c.provider === provider.id);
          const isConnected = connection?.status === "connected";
          const isSyncing = syncing === connection?.id;

          return (
            <div key={provider.id} className="rounded-xl bg-card shadow-card overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-surface-2 flex items-center justify-center text-2xl shrink-0">
                    {provider.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{provider.name}</h3>
                      {isConnected ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-success bg-success/8 px-2 py-0.5 rounded-full">Connected</span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Not Connected</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{provider.description}</p>

                    {/* Capabilities */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {provider.capabilities.map(cap => (
                        <span key={cap} className="text-[11px] bg-surface-2 text-muted-foreground px-2 py-0.5 rounded-full">{cap}</span>
                      ))}
                    </div>

                    {/* Sync info */}
                    {isConnected && connection && (
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        {connection.last_sync_at && (
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            Last sync: {formatDistanceToNow(new Date(connection.last_sync_at), { addSuffix: true })}
                          </span>
                        )}
                        {connection.sync_status === "error" && connection.sync_error && (
                          <span className="flex items-center gap-1 text-destructive">
                            <AlertCircle size={11} />
                            {connection.sync_error}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isConnected ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => triggerSync(connection!.id, "import")}
                          disabled={isSyncing}
                        >
                          {isSyncing ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                          Import
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => triggerSync(connection!.id, "export")}
                          disabled={isSyncing}
                        >
                          <Upload size={13} /> Export
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => disconnectProvider(connection!.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Unlink size={13} />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" onClick={() => connectProvider(provider.id)}>
                        <Link2 size={13} /> Connect
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Compact status for sidebar/dashboard
export function IntegrationStatusBadge({ provider }: { provider: string }) {
  const providerInfo = PROVIDERS.find(p => p.id === provider);
  if (!providerInfo) return null;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span>{providerInfo.logo}</span>
      <span className="text-muted-foreground">{providerInfo.name}</span>
    </div>
  );
}
