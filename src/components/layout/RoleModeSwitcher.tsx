import { useAuth, type AppMode } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Briefcase, Wrench } from "lucide-react";

const modes: { value: AppMode; label: string; icon: typeof Briefcase }[] = [
  { value: "grower", label: "Hire Work", icon: Briefcase },
  { value: "operator", label: "Do Work", icon: Wrench },
];

export function RoleModeSwitcher({ collapsed }: { collapsed: boolean }) {
  const { activeMode, setActiveMode } = useAuth();

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
