import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";
import { DetailSkeleton } from "@/components/shared/PageSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { CredentialManager } from "@/components/operators/CredentialManager";
import { EquipmentManager } from "@/components/operators/EquipmentManager";
import { VerifiedBadge, deriveBadgesFromRows } from "@/components/operators/VerifiedBadge";
import { formatOperationType } from "@/lib/format";
import { MapPin, Briefcase, Wrench, Users, Award, Clock, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";

function useOperatorProfile(operatorId?: string) {
  return useQuery({
    queryKey: ["operator-profile", operatorId],
    queryFn: async () => {
      const { data: op } = await supabase
        .from("operator_profiles")
        .select("*")
        .eq("id", operatorId!)
        .single();
      if (!op) return null;

      const [{ data: equipment }, { data: credentials }, { data: profile }] = await Promise.all([
        supabase.from("equipment").select("*").eq("operator_id", op.id),
        supabase.from("credentials").select("*").eq("operator_id", op.id),
        supabase.from("profiles").select("first_name, last_name, email, phone, avatar_url").eq("user_id", op.user_id).single(),
      ]);

      return { ...op, equipment: equipment || [], credentials: credentials || [], profile: profile || null };
    },
    enabled: !!operatorId,
  });
}

export default function OperatorProfile() {
  const { operatorId } = useParams();
  const { user, roles } = useAuth();
  const { data: op, isLoading } = useOperatorProfile(operatorId);

  if (isLoading) return <AppShell title=""><DetailSkeleton /></AppShell>;
  if (!op) return <AppShell title=""><EmptyState icon={<User size={24} />} title="Operator not found" description="This profile doesn't exist or you don't have access." /></AppShell>;

  const badges = deriveBadgesFromRows(op.credentials);
  const isOwn = user?.id === op.user_id;
  const isAdmin = roles.includes("admin");

  return (
    <AppShell title={op.business_name}>
      <div className="animate-fade-in max-w-4xl">
        {/* Header */}
        <div className="rounded-lg bg-card border p-5 mb-4">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-lg">
                {op.business_name?.charAt(0) || "O"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold">{op.business_name}</h2>
              {op.profile && (
                <p className="text-sm text-muted-foreground">
                  {op.profile.first_name} {op.profile.last_name}
                  {op.profile.email && ` · ${op.profile.email}`}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {badges.map(b => <VerifiedBadge key={b} type={b} size="sm" />)}
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                {op.base_address && <span className="flex items-center gap-1"><MapPin size={11} /> {op.base_address}</span>}
                {op.service_radius && <span className="flex items-center gap-1"><Clock size={11} /> {op.service_radius} mi radius</span>}
                {op.years_experience && <span className="flex items-center gap-1"><Award size={11} /> {op.years_experience} yrs exp.</span>}
                {op.crew_count && <span className="flex items-center gap-1"><Users size={11} /> {op.crew_count} crew</span>}
                {op.completed_jobs != null && <span className="flex items-center gap-1"><Briefcase size={11} /> {op.completed_jobs} jobs</span>}
                {op.rating != null && op.rating > 0 && <span className="flex items-center gap-1"><Star size={11} /> {op.rating.toFixed(1)}</span>}
              </div>
            </div>
          </div>
          {op.bio && <p className="text-sm text-muted-foreground mt-3 border-t pt-3">{op.bio}</p>}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Services */}
            <div className="rounded-lg bg-card border p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Wrench size={14} /> Services & Capabilities</h3>
              <div className="flex flex-wrap gap-1.5">
                {(op.service_types || []).map((st: string) => (
                  <span key={st} className="text-xs bg-secondary text-secondary-foreground rounded-full px-2.5 py-1 font-medium">
                    {formatOperationType(st)}
                  </span>
                ))}
              </div>
              {(op.machine_compatibility || []).length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1.5">File compatibility</p>
                  <div className="flex flex-wrap gap-1">
                    {op.machine_compatibility.map((m: string) => (
                      <span key={m} className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">{m}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Equipment & Verification */}
            <div className="rounded-lg bg-card border p-4">
              <EquipmentManager operatorProfileId={op.id} readOnly={!isOwn && !isAdmin} />
            </div>

            {/* Credentials */}
            <div className="rounded-lg bg-card border p-4">
              <CredentialManager operatorProfileId={op.id} readOnly={!isOwn && !isAdmin} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Performance placeholder */}
            <div className="rounded-lg bg-card border p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Award size={14} /> Performance</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Jobs completed</span><span className="font-medium tabular-nums">{op.completed_jobs || 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Rating</span><span className="font-medium tabular-nums">{op.rating ? `${Number(op.rating).toFixed(1)} / 5.0` : "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Reviews</span><span className="font-medium tabular-nums">{op.review_count || 0}</span></div>
              </div>
            </div>

            {/* Credential summary */}
            <div className="rounded-lg bg-card border p-4">
              <h3 className="text-sm font-semibold mb-3">Verification Summary</h3>
              <div className="space-y-2">
                {[
                  { label: "Insurance", check: op.credentials.some((c: any) => c.type === "insurance" && c.is_verified) },
                  { label: "License / Certification", check: op.credentials.some((c: any) => (c.type === "license" || c.type === "certification") && c.is_verified) },
                  { label: "CDL", check: op.credentials.some((c: any) => c.name?.toLowerCase().includes("cdl") && c.is_verified) },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={cn("text-xs font-medium", item.check ? "text-success" : "text-muted-foreground")}>
                      {item.check ? "✓ Verified" : "Not verified"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
