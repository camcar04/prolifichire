import { useAuth } from "@/contexts/AuthContext";
import GrowerDashboard from "@/components/dashboard/GrowerDashboard";
import OperatorDashboard from "@/components/dashboard/OperatorDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import AppShell from "@/components/layout/AppShell";

export default function Dashboard() {
  const { activeMode, roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const title = isAdmin
    ? "Admin Dashboard"
    : activeMode === "operator"
      ? "My Work Dashboard"
      : "My Farm Operations";

  return (
    <AppShell title={title}>
      {isAdmin ? <AdminDashboard /> : activeMode === "operator" ? <OperatorDashboard /> : <GrowerDashboard />}
    </AppShell>
  );
}
