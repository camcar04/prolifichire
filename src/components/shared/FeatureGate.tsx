import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCanPostJob, useCanBidOnJobs } from "@/hooks/useProfileScore";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Props {
  feature: "post_job" | "bid_on_job";
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ feature, children, fallback }: Props) {
  const { activeMode } = useAuth();

  if (feature === "post_job" && activeMode === "grower") {
    return <PostJobGate fallback={fallback}>{children}</PostJobGate>;
  }
  if (feature === "bid_on_job" && activeMode === "operator") {
    return <BidGate fallback={fallback}>{children}</BidGate>;
  }

  return <>{children}</>;
}

function PostJobGate({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { data, isLoading } = useCanPostJob();
  if (isLoading) return <>{children}</>;
  if (data?.allowed) return <>{children}</>;
  return fallback || <GateMessage reason={data?.reason || "Complete your setup first"} link="/fields" label="Add Farm & Field" />;
}

function BidGate({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { data, isLoading } = useCanBidOnJobs();
  if (isLoading) return <>{children}</>;
  if (data?.allowed) return <>{children}</>;
  return fallback || <GateMessage reason={data?.reason || "Complete your operator profile"} link="/settings?tab=account" label="Complete Setup" />;
}

function GateMessage({ reason, link, label }: { reason: string; link: string; label: string }) {
  return (
    <div className="rounded border-2 border-dashed border-warning/30 bg-warning/5 p-4 text-center">
      <AlertTriangle size={20} className="text-warning mx-auto mb-2" />
      <p className="text-sm font-medium mb-1">{reason}</p>
      <Button size="sm" variant="outline" className="mt-2 gap-1" asChild>
        <Link to={link}>{label} <ArrowRight size={13} /></Link>
      </Button>
    </div>
  );
}
