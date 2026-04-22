import { useState, useCallback } from "react";
import { useAuth, type AppMode } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Briefcase, Wrench, Lock, ArrowLeftRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ModeTransitionOverlay } from "@/components/layout/ModeTransitionOverlay";

const modes: { value: AppMode; label: string; icon: typeof Briefcase }[] = [
  { value: "grower", label: "Hire Work", icon: Briefcase },
  { value: "operator", label: "Do Work", icon: Wrench },
];

export function RoleModeSwitcher({ collapsed }: { collapsed: boolean }) {
  const { activeMode, setActiveMode, canSwitchRoles, hasRole } = useAuth();
  const navigate = useNavigate();
  const [transitioning, setTransitioning] = useState(false);
  const [transitionMode, setTransitionMode] = useState<AppMode>(activeMode);

  const handleSwitch = useCallback((newMode: AppMode) => {
    if (newMode === activeMode) return;
    setTransitionMode(newMode);
    setTransitioning(true);
    setActiveMode(newMode);
  }, [activeMode, setActiveMode]);

  const handleTransitionDone = useCallback(() => {
    setTransitioning(false);
    navigate("/dashboard");
  }, [navigate]);

  // Single role — show current mode, link to enable other
  if (!canSwitchRoles) {
    const current = modes.find(m => m.value === activeMode)!;
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
      </div>
    );
  }

  // Both roles — show switch
  if (collapsed) {
    const current = modes.find(m => m.value === activeMode)!;
    return (
      <>
        <button
          onClick={() => handleSwitch(activeMode === "grower" ? "operator" : "grower")}
          className="h-8 w-8 mx-auto rounded-lg bg-sidebar-accent flex items-center justify-center text-sidebar-foreground hover:bg-sidebar-accent/80 transition-colors"
          title={`Switch to ${activeMode === "grower" ? "Do Work" : "Hire Work"}`}
        >
          <current.icon size={14} />
        </button>
        <ModeTransitionOverlay mode={transitionMode} visible={transitioning} onDone={handleTransitionDone} />
      </>
    );
  }

  return (
    <>
      <div className="space-y-1.5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/40 px-1">Switch workspace</p>
        <div className="flex rounded-lg bg-sidebar-accent/50 p-1 gap-1">
          {modes.map((m) => (
            <button
              key={m.value}
              onClick={() => handleSwitch(m.value)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-all active:scale-[0.97]",
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
      <ModeTransitionOverlay mode={transitionMode} visible={transitioning} onDone={handleTransitionDone} />
    </>
  );
}
