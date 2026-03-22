import { useAuth, type AppMode } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Briefcase, Wrench, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const modes: { value: AppMode; label: string; icon: typeof Briefcase }[] = [
  { value: "grower", label: "Hire Work", icon: Briefcase },
  { value: "operator", label: "Do Work", icon: Wrench },
];

export function RoleModeSwitcher({ collapsed }: { collapsed: boolean }) {
  const { activeMode, setActiveMode, canSwitchRoles, hasRole } = useAuth();
  const navigate = useNavigate();

  // If user only has one role, show current mode indicator (no toggle)
  if (!canSwitchRoles) {
    const current = modes.find(m => m.value === activeMode)!;
    const otherRole = activeMode === "grower" ? "operator" : "grower";
    const otherLabel = activeMode === "grower" ? "Do Work" : "Hire Work";

    if (collapsed) {
      return (
        <div className="flex flex-col items-center gap-1">
          <div className="h-8 w-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-sidebar-foreground">
            <current.icon size={14} />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-1.5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/40 px-1">Workspace</p>
        <div className="rounded-lg bg-sidebar-accent/50 p-1">
          <div className="flex items-center gap-2 rounded-md bg-sidebar-primary text-sidebar-primary-foreground px-3 py-2 text-xs font-semibold">
            <current.icon size={14} />
            {current.label}
          </div>
        </div>
        {!hasRole(otherRole) && (
          <button
            onClick={() => navigate("/settings?tab=account")}
            className="flex items-center gap-1.5 px-1 py-1 text-[10px] text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors"
          >
            <Lock size={10} />
            Enable {otherLabel}
          </button>
        )}
      </div>
    );
  }

  // Both roles enabled — show toggle
  if (collapsed) {
    const current = modes.find(m => m.value === activeMode)!;
    return (
      <button
        onClick={() => setActiveMode(activeMode === "grower" ? "operator" : "grower")}
        className="h-8 w-8 mx-auto rounded-lg bg-sidebar-accent flex items-center justify-center text-sidebar-foreground hover:bg-sidebar-accent/80 transition-colors"
        title={`Switch to ${activeMode === "grower" ? "Do Work" : "Hire Work"}`}
      >
        <current.icon size={14} />
      </button>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/40 px-1">Switch workspace</p>
      <div className="flex rounded-lg bg-sidebar-accent/50 p-1 gap-1">
        {modes.map((m) => (
          <button
            key={m.value}
            onClick={() => setActiveMode(m.value)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-all",
              activeMode === m.value
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
            )}
          >
            <m.icon size={14} />
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
