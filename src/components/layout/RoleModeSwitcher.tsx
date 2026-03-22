import { useAuth, type AppMode } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Wheat, Tractor } from "lucide-react";

const modes: { value: AppMode; label: string; icon: typeof Wheat }[] = [
  { value: "grower", label: "Grower", icon: Wheat },
  { value: "operator", label: "Operator", icon: Tractor },
];

export function RoleModeSwitcher({ collapsed }: { collapsed: boolean }) {
  const { activeMode, setActiveMode } = useAuth();

  if (collapsed) {
    const current = modes.find(m => m.value === activeMode)!;
    return (
      <button
        onClick={() => setActiveMode(activeMode === "grower" ? "operator" : "grower")}
        className="h-8 w-8 mx-auto rounded-lg bg-sidebar-accent flex items-center justify-center text-sidebar-foreground hover:bg-sidebar-accent/80 transition-colors"
        title={`Switch to ${activeMode === "grower" ? "Operator" : "Grower"} mode`}
      >
        <current.icon size={14} />
      </button>
    );
  }

  return (
    <div className="flex rounded-lg bg-sidebar-accent/50 p-0.5">
      {modes.map((m) => (
        <button
          key={m.value}
          onClick={() => setActiveMode(m.value)}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-medium transition-all",
            activeMode === m.value
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
              : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
          )}
        >
          <m.icon size={12} />
          {m.label}
        </button>
      ))}
    </div>
  );
}
