import { useAuth } from "@/contexts/AuthContext";
import GrowerDashboard from "@/components/dashboard/GrowerDashboard";
import OperatorDashboard from "@/components/dashboard/OperatorDashboard";
import AppShell from "@/components/layout/AppShell";

export default function Dashboard() {
  const { activeMode } = useAuth();

  return (
    <AppShell title="Dashboard">
      {activeMode === "operator" ? <OperatorDashboard /> : <GrowerDashboard />}
    </AppShell>
  );
}
