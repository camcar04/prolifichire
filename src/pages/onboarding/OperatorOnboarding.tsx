import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StateSelect } from "@/components/ui/state-select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, ChevronRight, ChevronLeft, Check, Truck, User, Wrench, MapPin, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { WelcomeScreen } from "@/components/onboarding/WelcomeScreen";
import { trackEvent } from "@/lib/analytics";
import type { OperationType } from "@/types/domain";

const STEPS = [
  { id: "profile", label: "Contact Info", icon: User },
  { id: "business", label: "Business", icon: Truck },
  { id: "services", label: "Services & Equipment", icon: Wrench },
  { id: "location", label: "Location & Coverage", icon: MapPin },
  { id: "compliance", label: "Compliance", icon: Shield },
];

const SERVICE_TYPES: { value: OperationType; label: string }[] = [
  { value: "spraying", label: "Spraying / Application" },
  { value: "planting", label: "Planting" },
  { value: "harvest", label: "Harvest" },
  { value: "grain_hauling", label: "Grain Hauling / Semi Support" },
  { value: "tillage", label: "Tillage" },
  { value: "fertilizing", label: "Fertilizing" },
  { value: "hauling", label: "Hauling" },
  { value: "scouting", label: "Scouting" },
  { value: "soil_sampling", label: "Soil Sampling" },
  { value: "seeding", label: "Seeding" },
  { value: "mowing", label: "Mowing / Hay Cutting" },
  { value: "baling", label: "Baling" },
  { value: "rock_picking", label: "Rock Picking" },
  { value: "drainage", label: "Drainage" },
];

export default function OperatorOnboarding() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<OperationType[]>([]);
  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "", preferredComm: "in_app",
    businessName: "", contractSignerName: "", contractSignerEmail: "",
    address: "", city: "", state: "", zip: "", county: "",
    serviceRadius: "50", crewCount: "1",
    equipmentMake: "", equipmentModel: "", equipmentType: "", equipmentYear: "",
    hasInsurance: false, hasLicense: false,
  });

  if (showWelcome) {
    return (
      <WelcomeScreen
        mode="operator"
        userName={profile?.firstName || ""}
        onStart={() => setShowWelcome(false)}
      />
    );
  }

  const set = (key: string, val: string | boolean) => setForm(f => ({ ...f, [key]: val }));

  const toggleService = (s: OperationType) => {
    setServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { data: org, error: orgErr } = await supabase.from("organizations").insert({
        name: form.businessName || `${form.lastName} Custom Services`,
        type: "operator",
        address: form.address, city: form.city, state: form.state, zip: form.zip,
      }).select("id").single();
      if (orgErr) throw orgErr;

      // Get current enabled types to preserve them
      const { data: currentProfile } = await supabase.from("profiles").select("enabled_account_types, primary_account_type").eq("user_id", user.id).single();
      const currentEnabled = (currentProfile?.enabled_account_types as string[] | null) || [];
      const updatedEnabled = currentEnabled.includes("operator") ? currentEnabled : [...currentEnabled, "operator"];

      await supabase.from("profiles").update({
        first_name: form.firstName, last_name: form.lastName, phone: form.phone,
        organization_id: org.id, onboarding_completed: true,
        enabled_account_types: updatedEnabled,
        primary_account_type: currentProfile?.primary_account_type || "operator",
        preferred_comm_method: form.preferredComm as any,
        state: form.state || null,
        county: form.county || null,
      }).eq("user_id", user.id);

      await supabase.from("user_roles").insert({ user_id: user.id, role: "operator" as any });

      // Create org membership
      await supabase.from("organization_members").insert({
        organization_id: org.id, user_id: user.id, org_role: "owner",
      });

      const { data: opProfile } = await supabase.from("operator_profiles").insert({
        user_id: user.id, organization_id: org.id,
        business_name: form.businessName,
        service_types: services as any,
        service_radius: parseInt(form.serviceRadius) || 50,
        base_address: form.address,
        crew_count: parseInt(form.crewCount) || 1,
        contract_signer_name: form.contractSignerName,
        contract_signer_email: form.contractSignerEmail,
        onboarding_completed: true,
      }).select("id").single();

      if (form.address) {
        await supabase.from("locations").insert({
          organization_id: org.id, type: "headquarters", label: "Shop / Yard",
          address: form.address, city: form.city, state: form.state, zip: form.zip,
          is_primary: true,
        });
      }

      if (form.equipmentMake && opProfile) {
        await supabase.from("equipment").insert({
          operator_id: opProfile.id,
          type: form.equipmentType || "sprayer",
          make: form.equipmentMake,
          model: form.equipmentModel,
          year: parseInt(form.equipmentYear) || null,
        });
      }

      await supabase.from("communication_preferences").insert({
        user_id: user.id, preferred_method: form.preferredComm as any,
      });

      trackEvent(user.id, "onboarding_completed", { role: "operator", state: form.state, services });

      toast.success("Welcome to ProlificHire!");
      navigate("/dashboard");
    } catch (e: any) {
      toast.error(e.message || "Setup failed");
    }
    setSaving(false);
  };

  const canNext = () => {
    if (step === 0) return form.firstName.trim() && form.lastName.trim() && form.phone.trim();
    if (step === 1) return form.businessName.trim();
    if (step === 2) return services.length > 0;
    if (step === 3) return form.address.trim() && form.city.trim() && form.state.trim() && form.zip.trim() && form.county.trim();
    return true;
  };

  const validationMessage = () => {
    if (step === 0) {
      if (!form.firstName.trim()) return "First name is required";
      if (!form.lastName.trim()) return "Last name is required";
      if (!form.phone.trim()) return "Phone number is required";
    }
    if (step === 1 && !form.businessName.trim()) return "Business name is required";
    if (step === 2 && services.length === 0) return "Select at least one service you offer";
    if (step === 3) {
      if (!form.address.trim()) return "Shop/yard address is required";
      if (!form.city.trim()) return "City is required";
      if (!form.state) return "State is required";
      if (!form.zip.trim()) return "ZIP code is required";
      if (!form.county.trim()) return "County is required for job matching and routing";
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <div className="h-14 border-b bg-background flex items-center px-6">
        <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center mr-2">
          <span className="text-primary-foreground font-bold text-[10px]">PH</span>
        </div>
        <span className="font-bold text-sm tracking-tight">ProlificHire</span>
        <span className="ml-3 text-xs text-muted-foreground">Do Work — Setup your account</span>
      </div>

      <div className="flex-1 flex items-start justify-center pt-12 px-4">
        <div className="w-full max-w-xl">
          <div className="flex items-center gap-1 mb-8">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 transition-colors",
                  i < step ? "bg-primary text-primary-foreground" :
                  i === step ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2" :
                  "bg-muted text-muted-foreground"
                )}>
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("h-0.5 flex-1 mx-2 rounded", i < step ? "bg-primary" : "bg-border")} />
                )}
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-card shadow-card p-6">
            <h2 className="text-lg font-semibold mb-1">{STEPS[step].label}</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {step === 0 && "Your contact information."}
              {step === 1 && "Tell us about your business."}
              {step === 2 && "What services do you offer?"}
              {step === 3 && "Where do you operate from? County is required for job matching."}
              {step === 4 && "Insurance and certifications."}
            </p>

            {step === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>First name <span className="text-destructive">*</span></Label>
                    <Input value={form.firstName} onChange={e => set("firstName", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Last name <span className="text-destructive">*</span></Label>
                    <Input value={form.lastName} onChange={e => set("lastName", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Phone <span className="text-destructive">*</span></Label>
                  <Input value={form.phone} onChange={e => set("phone", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Preferred communication</Label>
                  <Select value={form.preferredComm} onValueChange={v => set("preferredComm", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_app">In-App</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Business name <span className="text-destructive">*</span></Label>
                  <Input value={form.businessName} onChange={e => set("businessName", e.target.value)} placeholder="e.g. AgriPro Custom Services" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Contract signer name</Label>
                    <Input value={form.contractSignerName} onChange={e => set("contractSignerName", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contract signer email</Label>
                    <Input type="email" value={form.contractSignerEmail} onChange={e => set("contractSignerEmail", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Crew / operator count</Label>
                  <Input type="number" value={form.crewCount} onChange={e => set("crewCount", e.target.value)} min="1" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <Label className="mb-3 block">Services offered <span className="text-destructive">*</span></Label>
                  <div className="grid grid-cols-2 gap-2">
                    {SERVICE_TYPES.map(s => (
                      <label key={s.value} className={cn(
                        "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors text-sm",
                        services.includes(s.value) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                      )}>
                        <Checkbox checked={services.includes(s.value)} onCheckedChange={() => toggleService(s.value)} />
                        {s.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="border-t pt-4">
                  <Label className="mb-3 block">Primary equipment (optional)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Make" value={form.equipmentMake} onChange={e => set("equipmentMake", e.target.value)} />
                    <Input placeholder="Model" value={form.equipmentModel} onChange={e => set("equipmentModel", e.target.value)} />
                    <Input placeholder="Type (e.g. sprayer)" value={form.equipmentType} onChange={e => set("equipmentType", e.target.value)} />
                    <Input placeholder="Year" type="number" value={form.equipmentYear} onChange={e => set("equipmentYear", e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Shop / yard address <span className="text-destructive">*</span></Label>
                  <Input value={form.address} onChange={e => set("address", e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>City <span className="text-destructive">*</span></Label>
                    <Input value={form.city} onChange={e => set("city", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>State <span className="text-destructive">*</span></Label>
                    <StateSelect value={form.state} onValueChange={v => set("state", v)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>ZIP <span className="text-destructive">*</span></Label>
                    <Input value={form.zip} onChange={e => set("zip", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>County <span className="text-destructive">*</span></Label>
                  <Input value={form.county} onChange={e => set("county", e.target.value)} placeholder="e.g. Lancaster" />
                  <p className="text-[11px] text-muted-foreground">Required — used for job matching and distance calculations.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Service radius (miles)</Label>
                  <Input type="number" value={form.serviceRadius} onChange={e => set("serviceRadius", e.target.value)} />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                  You can upload insurance certificates and licenses after setup in your profile.
                </p>
                <label className="flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <Checkbox checked={form.hasInsurance} onCheckedChange={(v) => set("hasInsurance", !!v)} />
                  <div>
                    <p className="text-sm font-medium">I have general liability insurance</p>
                    <p className="text-xs text-muted-foreground">You'll upload the certificate after setup</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <Checkbox checked={form.hasLicense} onCheckedChange={(v) => set("hasLicense", !!v)} />
                  <div>
                    <p className="text-sm font-medium">I have a commercial applicator license</p>
                    <p className="text-xs text-muted-foreground">Required for chemical application jobs</p>
                  </div>
                </label>
              </div>
            )}

            {!canNext() && validationMessage() && (
              <p className="text-xs text-destructive mt-3">{validationMessage()}</p>
            )}

            <div className="flex items-center justify-between mt-8 pt-4 border-t">
              <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
                <ChevronLeft size={16} className="mr-1" /> Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
                  Next <ChevronRight size={16} className="ml-1" />
                </Button>
              ) : (
                <Button onClick={handleFinish} disabled={saving || !canNext()}>
                  {saving && <Loader2 size={16} className="animate-spin mr-2" />}
                  Complete Setup
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
