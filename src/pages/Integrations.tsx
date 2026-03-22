import AppShell from "@/components/layout/AppShell";
import { OEMConnectionsPanel } from "@/components/integrations/OEMConnectionsPanel";

export default function Integrations() {
  return (
    <AppShell title="Integrations">
      <div className="max-w-3xl animate-fade-in">
        <OEMConnectionsPanel />
      </div>
    </AppShell>
  );
}
