import { useProfileScore } from "@/hooks/useProfileScore";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

const STEP_MAP: Record<string, { message: string; cta: string; link: string }> = {
  "Farm created": { message: "Create your first farm to start posting jobs", cta: "Create Farm", link: "/fields" },
  "At least one field": { message: "Add a field to your farm so you can post work", cta: "Add Field", link: "/fields" },
  "Field boundary": { message: "Add a field boundary for accurate job packets", cta: "Set Boundary", link: "/fields" },
  "Field location": { message: "Set your field location for operator routing", cta: "Set Location", link: "/fields" },
  "Base location": { message: "Set your base location so we can match you with nearby jobs", cta: "Set Location", link: "/settings?tab=dowork" },
  "Service radius": { message: "Define your service area to see relevant jobs", cta: "Set Radius", link: "/settings?tab=dowork" },
  "Service types": { message: "Select the services you offer to match with the right jobs", cta: "Add Services", link: "/settings?tab=dowork" },
  "At least one equipment record": { message: "Add your equipment to start bidding on jobs", cta: "Add Equipment", link: "/settings?tab=dowork" },
  "Operator profile": { message: "Complete your operator profile to get started", cta: "Complete Profile", link: "/settings?tab=dowork" },
};

export function NextStepBanner() {
  const { data: score, isLoading } = useProfileScore();
  const { activeMode } = useAuth();

  if (isLoading || !score || score.missing.length === 0 || score.total >= 80) return null;

  // Find the first actionable missing item
  const firstMissing = score.missing.find(m => STEP_MAP[m]);
  if (!firstMissing) return null;

  const step = STEP_MAP[firstMissing];

  return (
    <div className="rounded border border-primary/20 bg-primary/5 p-4 flex items-center gap-3 animate-fade-in">
      <div className="h-9 w-9 rounded bg-primary/10 flex items-center justify-center shrink-0">
        <Sparkles size={18} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Next step</p>
        <p className="text-xs text-muted-foreground">{step.message}</p>
      </div>
      <Button size="sm" className="shrink-0 gap-1 h-8 text-xs" asChild>
        <Link to={step.link}>{step.cta} <ArrowRight size={11} /></Link>
      </Button>
    </div>
  );
}
