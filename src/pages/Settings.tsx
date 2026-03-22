import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamManagement } from "@/components/settings/TeamManagement";
import { ProfileScoreCard } from "@/components/shared/ProfileScoreCard";
import { useProfileScore } from "@/hooks/useProfileScore";
import { Link } from "react-router-dom";
import {
  User, Bell, Shield, CreditCard, Users, Briefcase, Wrench, ArrowRight,
  CheckCircle2, Lock, AlertTriangle, MapPin, Truck, Wheat, Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Settings() {
  const { profile, user, roles, hasRole, canSwitchRoles, activeMode, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "account";
  const [enablingRole, setEnablingRole] = useState(false);
  const { data: score } = useProfileScore();

  const handleEnableRole = async (role: "grower" | "operator") => {
    if (!user) return;
    setEnablingRole(true);
    try {
      const currentEnabled = profile?.enabledAccountTypes || [];
      if (!currentEnabled.includes(role)) {
        await supabase.from("profiles").update({
          enabled_account_types: [...currentEnabled, role],
        }).eq("user_id", user.id);
      }
      if (!roles.includes(role as any)) {
        await supabase.from("user_roles").insert({ user_id: user.id, role: role as any });
      }
      await refreshProfile();
      toast.success(`${role === "grower" ? "Hire Work" : "Do Work"} role enabled!`);
    } catch {
      toast.error("Failed to enable role.");
    }
    setEnablingRole(false);
  };

  return (
    <AppShell title="Account Hub">
      <div className="max-w-3xl animate-fade-in">
        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList className="h-8 flex-wrap">
            <TabsTrigger value="account" className="text-xs gap-1"><Settings2 size={12} /> Account</TabsTrigger>
            <TabsTrigger value="profile" className="text-xs gap-1"><User size={12} /> Profile</TabsTrigger>
            {hasRole("grower") && <TabsTrigger value="hirework" className="text-xs gap-1"><Wheat size={12} /> Hire Work</TabsTrigger>}
            {hasRole("operator") && <TabsTrigger value="dowork" className="text-xs gap-1"><Truck size={12} /> Do Work</TabsTrigger>}
            <TabsTrigger value="team" className="text-xs gap-1"><Users size={12} /> Team</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs gap-1"><Bell size={12} /> Alerts</TabsTrigger>
            <TabsTrigger value="security" className="text-xs gap-1"><Shield size={12} /> Security</TabsTrigger>
          </TabsList>

          {/* ── Account Overview ── */}
          <TabsContent value="account" className="space-y-5">
            {/* Profile Completion */}
            <ProfileScoreCard />

            {/* Blocked Actions */}
            {score && score.total < 80 && (
              <section className="rounded-lg border border-warning/20 bg-warning/5 p-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <AlertTriangle size={13} className="text-warning" /> Actions Currently Blocked
                </h3>
                <div className="space-y-1.5">
                  {activeMode === "grower" && score.missing.some(m => m.includes("Farm") || m.includes("field")) && (
                    <BlockedItem label="Post a job" reason="Add a farm and field first" link="/fields" cta="Go to Fields" />
                  )}
                  {activeMode === "operator" && score.missing.some(m => m.includes("equipment") || m.includes("Equipment")) && (
                    <BlockedItem label="Bid on jobs" reason="Add equipment to your profile" link="/settings?tab=dowork" cta="Add Equipment" />
                  )}
                  {activeMode === "operator" && score.missing.some(m => m.includes("Service radius") || m.includes("Base location")) && (
                    <BlockedItem label="Receive job matches" reason="Set your base location and service radius" link="/settings?tab=dowork" cta="Set Location" />
                  )}
                </div>
              </section>
            )}

            {/* Account Types */}
            <section className="rounded-lg bg-card border p-5">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
                <Briefcase size={14} /> Account Types
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <RoleCard
                  icon={<Briefcase size={16} />}
                  title="Hire Work"
                  desc="Post jobs, manage fields, hire operators."
                  enabled={hasRole("grower")}
                  isPrimary={profile?.primaryAccountType === "grower"}
                  onEnable={() => handleEnableRole("grower")}
                  enabling={enablingRole}
                />
                <RoleCard
                  icon={<Wrench size={16} />}
                  title="Do Work"
                  desc="Accept jobs, submit quotes, manage equipment."
                  enabled={hasRole("operator")}
                  isPrimary={profile?.primaryAccountType === "operator"}
                  onEnable={() => handleEnableRole("operator")}
                  enabling={enablingRole}
                />
              </div>
              {canSwitchRoles && (
                <p className="text-[11px] text-muted-foreground mt-4 flex items-center gap-1">
                  <CheckCircle2 size={11} className="text-primary" />
                  Both roles enabled. Use the workspace switcher in the sidebar.
                </p>
              )}
            </section>
          </TabsContent>

          {/* ── Profile ── */}
          <TabsContent value="profile" className="space-y-6">
            <section className="rounded-lg bg-card border p-5">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-4"><User size={14} /> Profile</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">First Name</Label>
                  <Input defaultValue={profile?.firstName || ""} className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Last Name</Label>
                  <Input defaultValue={profile?.lastName || ""} className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Email</Label>
                  <Input defaultValue={profile?.email || ""} className="h-8 text-sm" disabled />
                </div>
              </div>
              <Button size="sm" className="mt-4 h-8 text-xs">Save Changes</Button>
            </section>
            <section className="rounded-lg bg-card border p-5">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-4"><CreditCard size={14} /> Billing</h2>
              <p className="text-[13px] text-muted-foreground">Payment method and billing settings will be available when Stripe Connect is configured.</p>
            </section>
          </TabsContent>

          {/* ── Hire Work Section ── */}
          {hasRole("grower") && (
            <TabsContent value="hirework" className="space-y-5">
              <section className="rounded-lg bg-card border p-5">
                <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><Wheat size={14} /> Farms & Fields</h2>
                <p className="text-[13px] text-muted-foreground mb-3">Manage your farms, fields, and boundaries.</p>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1" asChild>
                  <Link to="/fields">Manage Fields <ArrowRight size={11} /></Link>
                </Button>
              </section>
              <section className="rounded-lg bg-card border p-5">
                <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><Briefcase size={14} /> Job Preferences</h2>
                <p className="text-[13px] text-muted-foreground">Default hiring mode, timing preferences, and job templates.</p>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1 mt-3" asChild>
                  <Link to="/templates">Job Templates <ArrowRight size={11} /></Link>
                </Button>
              </section>
            </TabsContent>
          )}

          {/* ── Do Work Section ── */}
          {hasRole("operator") && (
            <TabsContent value="dowork" className="space-y-5">
              <section className="rounded-lg bg-card border p-5">
                <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><MapPin size={14} /> Location & Service Area</h2>
                <p className="text-[13px] text-muted-foreground mb-3">Set your base location and service radius to receive relevant job matches.</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Base Address</Label>
                    <Input placeholder="Shop/yard address" className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Service Radius (miles)</Label>
                    <Input type="number" placeholder="e.g. 50" className="h-8 text-sm" />
                  </div>
                </div>
                <Button size="sm" className="mt-3 h-8 text-xs">Save Location</Button>
              </section>

              <section className="rounded-lg bg-card border p-5">
                <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><Truck size={14} /> Equipment</h2>
                <p className="text-[13px] text-muted-foreground mb-3">Add your equipment to match with the right jobs.</p>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1" asChild>
                  <Link to="/settings?tab=dowork">Manage Equipment <ArrowRight size={11} /></Link>
                </Button>
              </section>

              <section className="rounded-lg bg-card border p-5">
                <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><Shield size={14} /> Credentials & Insurance</h2>
                <p className="text-[13px] text-muted-foreground mb-3">Upload licenses, certifications, and insurance for verification.</p>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1" asChild>
                  <Link to="/settings?tab=dowork">Manage Credentials <ArrowRight size={11} /></Link>
                </Button>
              </section>
            </TabsContent>
          )}

          {/* ── Team ── */}
          <TabsContent value="team">
            <TeamManagement />
          </TabsContent>

          {/* ── Notifications ── */}
          <TabsContent value="notifications">
            <section className="rounded-lg bg-card border p-5">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-4"><Bell size={14} /> Notification Preferences</h2>
              <div className="space-y-3">
                {[
                  { label: "Job status updates", desc: "When jobs are accepted, started, or completed" },
                  { label: "Quote notifications", desc: "When operators submit quotes on your jobs" },
                  { label: "Payment updates", desc: "Invoice created, payment processed, payout completed" },
                  { label: "Field packet alerts", desc: "When packets are ready or missing required files" },
                  { label: "Contract reminders", desc: "Signature requests and pending approvals" },
                ].map((pref) => (
                  <div key={pref.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium">{pref.label}</p>
                      <p className="text-[11px] text-muted-foreground">{pref.desc}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </div>
            </section>
          </TabsContent>

          {/* ── Security ── */}
          <TabsContent value="security">
            <section className="rounded-lg bg-card border p-5">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-4"><Shield size={14} /> Security</h2>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Change Password</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input type="password" placeholder="New password" className="h-8 text-sm" />
                    <Button variant="outline" size="sm" className="h-8 text-xs shrink-0">Update</Button>
                  </div>
                </div>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function RoleCard({ icon, title, desc, enabled, isPrimary, onEnable, enabling }: {
  icon: React.ReactNode; title: string; desc: string;
  enabled: boolean; isPrimary: boolean;
  onEnable: () => void; enabling: boolean;
}) {
  return (
    <div className={cn(
      "rounded-lg border-2 p-4 transition-colors",
      enabled ? "border-primary/30 bg-primary/5" : "border-border"
    )}>
      <div className="flex items-center gap-2 mb-2">
        <span className={enabled ? "text-primary" : "text-muted-foreground"}>{icon}</span>
        <span className="text-sm font-semibold">{title}</span>
        {enabled && <CheckCircle2 size={14} className="text-primary ml-auto" />}
      </div>
      <p className="text-[12px] text-muted-foreground mb-3">{desc}</p>
      {enabled ? (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-primary font-medium flex items-center gap-1">
            <CheckCircle2 size={11} /> Enabled
          </span>
          {isPrimary && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Primary</span>}
        </div>
      ) : (
        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={enabling} onClick={onEnable}>
          Enable <ArrowRight size={12} className="ml-1" />
        </Button>
      )}
    </div>
  );
}

function BlockedItem({ label, reason, link, cta }: { label: string; reason: string; link: string; cta: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{reason}</p>
      </div>
      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 shrink-0" asChild>
        <Link to={link}>{cta} <ArrowRight size={10} /></Link>
      </Button>
    </div>
  );
}
