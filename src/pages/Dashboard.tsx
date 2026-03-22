import { useAuth } from "@/contexts/AuthContext";
import GrowerDashboard from "@/components/dashboard/GrowerDashboard";
import OperatorDashboard from "@/components/dashboard/OperatorDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import AppShell from "@/components/layout/AppShell";

export default function Dashboard() {
  const { activeMode, roles } = useAuth();
  const isAdmin = roles.includes("admin");

  return (
    <AppShell title="Dashboard">
      {isAdmin ? <AdminDashboard /> : activeMode === "operator" ? <OperatorDashboard /> : <GrowerDashboard />}
    </AppShell>
  );
}
