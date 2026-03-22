import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeamManagement } from "@/components/settings/TeamManagement";
import { ProfileScoreCard } from "@/components/shared/ProfileScoreCard";
import { EquipmentManager } from "@/components/operators/EquipmentManager";
import { CredentialManager } from "@/components/operators/CredentialManager";
import { useProfileScore } from "@/hooks/useProfileScore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  User, Bell, Shield, CreditCard, Users, Briefcase, Wrench, ArrowRight,
  CheckCircle2, Lock, AlertTriangle, MapPin, Truck, Wheat, Settings2,
  Loader2, Save, Target, Compass,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { US_STATES } from "@/components/ui/state-select";
import { formatOperationType } from "@/lib/format";
import type { OperationType } from "@/types/domain";

const SERVICE_TYPE_OPTIONS: OperationType[] = [
  "spraying", "planting", "harvest", "grain_hauling", "fertilizing",
  "tillage", "hauling", "soil_sampling", "mowing", "baling", "rock_picking",
];

export default function Settings() {
  const { profile, user, roles, hasRole, canSwitchRoles, activeMode, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "account";
  const [enablingRole, setEnablingRole] = useState(false);
  const { data: score } = useProfileScore();
  const queryClient = useQueryClient();

  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
    }
  }, [profile]);

  // Fetch phone separately
  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("phone").eq("user_id", user.id).single().then(({ data }) => {
        if (data?.phone) setPhone(data.phone);
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim() || null,
    }).eq("user_id", user.id);
    setSavingProfile(false);
    if (error) { toast.error("Failed to save profile"); return; }
    await refreshProfile();
    queryClient.invalidateQueries({ queryKey: ["profile-score"] });
    toast.success("Profile saved");
  };

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const handlePasswordChange = async () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) { toast.error(error.message); return; }
    setNewPassword("");
    toast.success("Password updated");
  };

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
            <TabsTrigger value="account" className="text-xs gap-1"><Settings2 size={12} /> Overview</TabsTrigger>
            <TabsTrigger value="profile" className="text-xs gap-1"><User size={12} /> Profile</TabsTrigger>
            {hasRole("grower") && <TabsTrigger value="hirework" className="text-xs gap-1"><Wheat size={12} /> Hire Work</TabsTrigger>}
            {hasRole("operator") && <TabsTrigger value="dowork" className="text-xs gap-1"><Truck size={12} /> Do Work</TabsTrigger>}
            <TabsTrigger value="team" className="text-xs gap-1"><Users size={12} /> Team</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs gap-1"><Bell size={12} /> Alerts</TabsTrigger>
            <TabsTrigger value="security" className="text-xs gap-1"><Shield size={12} /> Security</TabsTrigger>
          </TabsList>

          {/* ── Account Overview ── */}
          <TabsContent value="account" className="space-y-5">
            <ProfileScoreCard />

            {score && score.missing.length > 0 && (
              <section className="rounded-lg border border-warning/20 bg-warning/5 p-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <AlertTriangle size={13} className="text-warning" /> Setup Required
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
                  {activeMode === "operator" && score.missing.some(m => m.includes("Service types")) && (
                    <BlockedItem label="Match with jobs" reason="Select the types of work you perform" link="/settings?tab=dowork" cta="Set Services" />
                  )}
                </div>
              </section>
            )}

            <section className="rounded-lg bg-card border p-5">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
                <Briefcase size={14} /> Account Types
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <RoleCard
                  icon={<Briefcase size={16} />} title="Hire Work"
                  desc="Post jobs, manage fields, hire operators."
                  enabled={hasRole("grower")} isPrimary={profile?.primaryAccountType === "grower"}
                  onEnable={() => handleEnableRole("grower")} enabling={enablingRole}
                />
                <RoleCard
                  icon={<Wrench size={16} />} title="Do Work"
                  desc="Accept jobs, submit quotes, manage equipment."
                  enabled={hasRole("operator")} isPrimary={profile?.primaryAccountType === "operator"}
                  onEnable={() => handleEnableRole("operator")} enabling={enablingRole}
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
                  <Label className="text-xs">First Name <span className="text-destructive">*</span></Label>
                  <Input value={firstName} onChange={e => setFirstName(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Last Name <span className="text-destructive">*</span></Label>
                  <Input value={lastName} onChange={e => setLastName(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input defaultValue={profile?.email || ""} className="h-8 text-sm" disabled />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" className="h-8 text-sm" />
                </div>
              </div>
              <Button size="sm" className="mt-4 h-8 text-xs gap-1" onClick={handleSaveProfile} disabled={savingProfile || !firstName.trim() || !lastName.trim()}>
                {savingProfile ? <><Loader2 size={12} className="animate-spin" /> Saving…</> : <><Save size={12} /> Save Changes</>}
              </Button>
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
              <OperatorLocationSection />
              <OperatorServicesSection />
              <OperatorEquipmentSection />
              <OperatorCredentialsSection />
            </TabsContent>
          )}

          {/* ── Team ── */}
          <TabsContent value="team"><TeamManagement /></TabsContent>

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
                    <Input
                      type="password" placeholder="New password (min 6 chars)"
                      className="h-8 text-sm" value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                    <Button variant="outline" size="sm" className="h-8 text-xs shrink-0 gap-1"
                      onClick={handlePasswordChange}
                      disabled={changingPassword || newPassword.length < 6}>
                      {changingPassword ? <Loader2 size={12} className="animate-spin" /> : "Update"}
                    </Button>
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

/* ── Operator Location Section ── */
function OperatorLocationSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: opProfile } = useQuery({
    queryKey: ["operator-profile-settings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("operator_profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
  });

  useEffect(() => {
    if (opProfile) {
      setAddress(opProfile.base_address || "");
      setRadius(opProfile.service_radius?.toString() || "");
      // Parse address components if stored as single string
      // The base_address field stores the full address
    }
  }, [opProfile]);

  const handleSave = async () => {
    if (!user || !opProfile) return;
    setSaving(true);
    const fullAddress = [address, city, state, zip].filter(Boolean).join(", ");
    const { error } = await supabase.from("operator_profiles").update({
      base_address: fullAddress || address,
      service_radius: radius ? parseFloat(radius) : null,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) { toast.error("Failed to save location"); return; }
    queryClient.invalidateQueries({ queryKey: ["operator-profile-settings"] });
    queryClient.invalidateQueries({ queryKey: ["profile-score"] });
    queryClient.invalidateQueries({ queryKey: ["can-bid-jobs"] });
    toast.success("Location and service area saved");
  };

  if (!opProfile) {
    return (
      <section className="rounded-lg bg-card border p-5">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><MapPin size={14} /> Location & Service Area</h2>
        <p className="text-[13px] text-muted-foreground">Complete operator onboarding to set your location.</p>
      </section>
    );
  }

  const hasLocation = !!opProfile.base_address || (opProfile.base_lat && opProfile.base_lng);
  const hasRadius = !!opProfile.service_radius;

  return (
    <section className="rounded-lg bg-card border p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold flex items-center gap-2"><MapPin size={14} /> Location & Service Area</h2>
        <div className="flex items-center gap-2">
          {hasLocation && <span className="text-[10px] text-success flex items-center gap-0.5"><CheckCircle2 size={9} /> Location set</span>}
          {hasRadius && <span className="text-[10px] text-success flex items-center gap-0.5"><CheckCircle2 size={9} /> {opProfile.service_radius}mi radius</span>}
          {!hasLocation && <span className="text-[10px] text-warning flex items-center gap-0.5"><AlertTriangle size={9} /> Required</span>}
        </div>
      </div>
      <p className="text-[12px] text-muted-foreground mb-3">Your base location is used to calculate distances to jobs and filter your marketplace.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs">Base Address (shop/yard) <span className="text-destructive">*</span></Label>
          <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 County Road 42, Ames, IA 50010" className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Service Radius (miles) <span className="text-destructive">*</span></Label>
          <Input type="number" value={radius} onChange={e => setRadius(e.target.value)} placeholder="e.g. 50" className="h-8 text-sm" min="1" max="500" />
        </div>
      </div>
      <Button size="sm" className="mt-3 h-8 text-xs gap-1" onClick={handleSave} disabled={saving || !address.trim()}>
        {saving ? <><Loader2 size={12} className="animate-spin" /> Saving…</> : <><Save size={12} /> Save Location</>}
      </Button>
    </section>
  );
}

/* ── Operator Services Section ── */
function OperatorServicesSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: opProfile } = useQuery({
    queryKey: ["operator-profile-settings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("operator_profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
  });

  useEffect(() => {
    if (opProfile?.service_types) {
      setSelectedServices(opProfile.service_types as string[]);
    }
  }, [opProfile]);

  const toggleService = (svc: string) => {
    setSelectedServices(prev => prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]);
  };

  const handleSave = async () => {
    if (!user || !opProfile) return;
    setSaving(true);
    const { error } = await supabase.from("operator_profiles").update({
      service_types: selectedServices as any,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) { toast.error("Failed to save services"); return; }
    queryClient.invalidateQueries({ queryKey: ["operator-profile-settings"] });
    queryClient.invalidateQueries({ queryKey: ["profile-score"] });
    queryClient.invalidateQueries({ queryKey: ["can-bid-jobs"] });
    toast.success("Service types saved");
  };

  if (!opProfile) return null;

  return (
    <section className="rounded-lg bg-card border p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold flex items-center gap-2"><Target size={14} /> Service Types</h2>
        {selectedServices.length > 0 && (
          <span className="text-[10px] text-success flex items-center gap-0.5"><CheckCircle2 size={9} /> {selectedServices.length} selected</span>
        )}
      </div>
      <p className="text-[12px] text-muted-foreground mb-3">Select the types of work you perform. This determines which jobs you see.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {SERVICE_TYPE_OPTIONS.map(svc => (
          <label key={svc} className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors text-[12px]",
            selectedServices.includes(svc) ? "border-primary/40 bg-primary/5 text-foreground" : "border-border hover:bg-surface-2 text-muted-foreground"
          )}>
            <Checkbox checked={selectedServices.includes(svc)} onCheckedChange={() => toggleService(svc)} />
            {formatOperationType(svc)}
          </label>
        ))}
      </div>
      <Button size="sm" className="mt-3 h-8 text-xs gap-1" onClick={handleSave} disabled={saving || selectedServices.length === 0}>
        {saving ? <><Loader2 size={12} className="animate-spin" /> Saving…</> : <><Save size={12} /> Save Services</>}
      </Button>
    </section>
  );
}

/* ── Operator Equipment Section ── */
function OperatorEquipmentSection() {
  const { user } = useAuth();

  const { data: opProfile } = useQuery({
    queryKey: ["operator-profile-settings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("operator_profiles").select("id").eq("user_id", user!.id).single();
      return data;
    },
  });

  if (!opProfile) {
    return (
      <section className="rounded-lg bg-card border p-5">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><Wrench size={14} /> Equipment</h2>
        <p className="text-[13px] text-muted-foreground">Complete operator onboarding to manage equipment.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg bg-card border p-5">
      <EquipmentManager operatorProfileId={opProfile.id} />
    </section>
  );
}

/* ── Operator Credentials Section ── */
function OperatorCredentialsSection() {
  const { user } = useAuth();

  const { data: opProfile } = useQuery({
    queryKey: ["operator-profile-settings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("operator_profiles").select("id").eq("user_id", user!.id).single();
      return data;
    },
  });

  if (!opProfile) {
    return (
      <section className="rounded-lg bg-card border p-5">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><Shield size={14} /> Credentials & Insurance</h2>
        <p className="text-[13px] text-muted-foreground">Complete operator onboarding to manage credentials.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg bg-card border p-5">
      <CredentialManager operatorProfileId={opProfile.id} />
    </section>
  );
}

/* ── Shared Components ── */
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
