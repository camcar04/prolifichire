import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin }: ProtectedRouteProps) {
  const { isAuthenticated, loading, roles, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-[10px]">PH</span>
          </div>
          <div className="h-1 w-24 rounded-full bg-muted overflow-hidden">
            <div className="h-full w-1/2 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (profile?.suspendedAt && location.pathname !== "/suspended") {
    return <Navigate to="/suspended" replace />;
  }

  if (requireAdmin && !roles.includes("admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-sm mx-auto p-8">
          <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-destructive text-lg font-bold">⛔</span>
          </div>
          <h2 className="text-lg font-semibold mb-1">Access Restricted</h2>
          <p className="text-sm text-muted-foreground">You don't have permission to view this page. Contact your administrator if you believe this is an error.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
