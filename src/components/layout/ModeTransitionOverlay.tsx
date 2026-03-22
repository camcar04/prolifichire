import { useEffect, useState } from "react";
import { Briefcase, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppMode } from "@/contexts/AuthContext";

interface Props {
  mode: AppMode;
  visible: boolean;
  onDone: () => void;
}

const CONFIG: Record<AppMode, { icon: typeof Briefcase; title: string; subtitle: string }> = {
  grower: {
    icon: Briefcase,
    title: "Hire Work",
    subtitle: "Manage fields, post jobs, and hire operators",
  },
  operator: {
    icon: Wrench,
    title: "Do Work",
    subtitle: "Find jobs, manage routes, and track earnings",
  },
};

export function ModeTransitionOverlay({ mode, visible, onDone }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onDone, 300);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [visible, onDone]);

  if (!visible && !show) return null;

  const c = CONFIG[mode];
  const Icon = c.icon;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm transition-opacity duration-300",
        show ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="text-center animate-fade-in">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Icon size={28} className="text-primary" />
        </div>
        <h2 className="text-lg font-bold mb-1">{c.title}</h2>
        <p className="text-sm text-muted-foreground max-w-xs">{c.subtitle}</p>
      </div>
    </div>
  );
}
