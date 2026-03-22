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
import { User, Bell, Shield, CreditCard, Users, Briefcase, Wrench, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Settings() {
  const { profile, user, roles, hasRole, canSwitchRoles, activeMode, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "profile";
  const [enablingRole, setEnablingRole] = useState(false);

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

      // Also add user_role if missing
      if (!roles.includes(role as any)) {
        await supabase.from("user_roles").insert({ user_id: user.id, role: role as any });
      }

      await refreshProfile();
      toast.success(`${role === "grower" ? "Hire Work" : "Do Work"} role enabled! Complete onboarding to get started.`);
    } catch {
      toast.error("Failed to enable role.");
    }
    setEnablingRole(false);
  };

  return (
    <AppShell title="Settings">
      <div className="max-w-3xl animate-fade-in">
        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList className="h-8 flex-wrap">
            <TabsTrigger value="profile" className="text-xs gap-1"><User size={12} /> Profile</TabsTrigger>
            <TabsTrigger value="account" className="text-xs gap-1"><Briefcase size={12} /> Account</TabsTrigger>
            <TabsTrigger value="team" className="text-xs gap-1"><Users size={12} /> Team</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs gap-1"><Bell size={12} /> Notifications</TabsTrigger>
            <TabsTrigger value="security" className="text-xs gap-1"><Shield size={12} /> Security</TabsTrigger>
          </TabsList>

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
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-4"><CreditCard size={14} /> Billing & Payments</h2>
              <p className="text-[13px] text-muted-foreground">Payment method and billing settings will be available when Stripe Connect is configured.</p>
            </section>
          </TabsContent>

          {/* Account Types Tab */}
          <TabsContent value="account" className="space-y-6">
            <section className="rounded-lg bg-card border p-5">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
                <Briefcase size={14} /> Account Types
              </h2>
              <p className="text-[13px] text-muted-foreground mb-5">
                Manage your account roles. Enable additional roles to access more features.
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                {/* Hire Work role card */}
                <div className={cn(
                  "rounded-lg border-2 p-4 transition-colors",
                  hasRole("grower") ? "border-primary/30 bg-primary/5" : "border-border"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase size={16} className={hasRole("grower") ? "text-primary" : "text-muted-foreground"} />
                    <span className="text-sm font-semibold">Hire Work</span>
                    {hasRole("grower") && <CheckCircle2 size={14} className="text-primary ml-auto" />}
                  </div>
                  <p className="text-[12px] text-muted-foreground mb-3">Post jobs, manage fields, hire operators.</p>
                  {hasRole("grower") ? (
                    <p className="text-[11px] text-primary font-medium flex items-center gap-1">
                      <CheckCircle2 size={11} /> Enabled
                    </p>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={enablingRole}
                      onClick={() => handleEnableRole("grower")}
                    >
                      Enable <ArrowRight size={12} className="ml-1" />
                    </Button>
                  )}
                </div>

                {/* Do Work role card */}
                <div className={cn(
                  "rounded-lg border-2 p-4 transition-colors",
                  hasRole("operator") ? "border-primary/30 bg-primary/5" : "border-border"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench size={16} className={hasRole("operator") ? "text-primary" : "text-muted-foreground"} />
                    <span className="text-sm font-semibold">Do Work</span>
                    {hasRole("operator") && <CheckCircle2 size={14} className="text-primary ml-auto" />}
                  </div>
                  <p className="text-[12px] text-muted-foreground mb-3">Accept jobs, submit quotes, manage equipment.</p>
                  {hasRole("operator") ? (
                    <p className="text-[11px] text-primary font-medium flex items-center gap-1">
                      <CheckCircle2 size={11} /> Enabled
                    </p>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={enablingRole}
                      onClick={() => handleEnableRole("operator")}
                    >
                      Enable <ArrowRight size={12} className="ml-1" />
                    </Button>
                  )}
                </div>
              </div>

              {canSwitchRoles && (
                <p className="text-[11px] text-muted-foreground mt-4 flex items-center gap-1">
                  <CheckCircle2 size={11} className="text-primary" />
                  Both roles enabled. Use the workspace switcher in the sidebar to toggle.
                </p>
              )}
            </section>

            <section className="rounded-lg bg-card border p-5">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Lock size={14} /> Primary Account
              </h2>
              <p className="text-[13px] text-muted-foreground">
                Your primary account type is <span className="font-medium text-foreground">{profile?.primaryAccountType === "operator" ? "Do Work" : "Hire Work"}</span>.
                This determines your default workspace on login.
              </p>
            </section>
          </TabsContent>

          <TabsContent value="team">
            <TeamManagement />
          </TabsContent>

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
