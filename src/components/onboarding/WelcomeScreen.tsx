import { Button } from "@/components/ui/button";
import { Briefcase, Wrench, MapPin, Truck, Wheat, ArrowRight, CheckCircle2 } from "lucide-react";
import type { AppMode } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface Props {
  mode: AppMode;
  userName: string;
  onStart: () => void;
}

const GROWER_STEPS = [
  { icon: Wheat, label: "Create your farm", desc: "Name and locate your operation" },
  { icon: MapPin, label: "Add your first field", desc: "Map it or enter details manually" },
  { icon: Briefcase, label: "Post your first job", desc: "Get qualified operators working for you" },
];

const OPERATOR_STEPS = [
  { icon: MapPin, label: "Set your base location", desc: "Where your shop or yard is" },
  { icon: Truck, label: "Add your equipment", desc: "Match with the right jobs" },
  { icon: Briefcase, label: "Find your first job", desc: "Browse and bid on available work" },
];

export function WelcomeScreen({ mode, userName, onStart }: Props) {
  const steps = mode === "operator" ? OPERATOR_STEPS : GROWER_STEPS;
  const greeting = userName ? `Welcome, ${userName}` : "Welcome";
  const goal = mode === "operator"
    ? "Let's get you set up to find and complete jobs."
    : "Let's get you set up to hire qualified operators.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-2 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-xl bg-card shadow-card p-8 text-center">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            {mode === "operator" ? <Wrench size={24} className="text-primary" /> : <Briefcase size={24} className="text-primary" />}
          </div>

          <h1 className="text-xl font-bold mb-1">{greeting}</h1>
          <p className="text-sm text-muted-foreground mb-8">{goal}</p>

          <div className="space-y-3 text-left mb-8">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-surface-2 p-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <step.icon size={16} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground/40 mt-1 shrink-0">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>

          <Button onClick={onStart} className="w-full gap-2" size="lg">
            Get Started <ArrowRight size={16} />
          </Button>

          <p className="text-[11px] text-muted-foreground mt-4">Takes about 2 minutes</p>
        </div>
      </div>
    </div>
  );
}
