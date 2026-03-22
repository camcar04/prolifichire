import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StateSelect } from "@/components/ui/state-select";
import { toast } from "sonner";
import { Loader2, ChevronRight, ChevronLeft, Check, MapPin, User, Building2, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "profile", label: "Your Profile", icon: User },
  { id: "organization", label: "Farm / Organization", icon: Building2 },
  { id: "contacts", label: "Contacts & Billing", icon: Phone },
  { id: "location", label: "Location", icon: MapPin },
];

export default function GrowerOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "", role: "owner",
    orgName: "", orgType: "farm",
    billingContactName: "", billingContactEmail: "",
    approvalContactName: "", approvalContactEmail: "",
    preferredComm: "in_app",
    address: "", city: "", state: "", zip: "", county: "",
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { data: org, error: orgErr } = await supabase.from("organizations").insert({
        name: form.orgName || `${form.lastName} Farms`,
        type: form.orgType,
        address: form.address, city: form.city, state: form.state, zip: form.zip,
      }).select("id").single();
      if (orgErr) throw orgErr;

      await supabase.from("profiles").update({
        first_name: form.firstName, last_name: form.lastName, phone: form.phone,
        organization_id: org.id, onboarding_completed: true,
        billing_contact_name: form.billingContactName,
        billing_contact_email: form.billingContactEmail,
        approval_contact_name: form.approvalContactName,
        approval_contact_email: form.approvalContactEmail,
        preferred_comm_method: form.preferredComm as any,
      }).eq("user_id", user.id);

      await supabase.from("user_roles").insert({ user_id: user.id, role: "grower" as any });

      // Create org membership
      await supabase.from("organization_members").insert({
        organization_id: org.id, user_id: user.id, org_role: "owner",
      });

      if (form.address) {
        await supabase.from("locations").insert({
          organization_id: org.id, type: "headquarters", label: "Farm HQ",
          address: form.address, city: form.city, state: form.state, zip: form.zip,
          is_primary: true,
        });
      }

      await supabase.from("communication_preferences").insert({
        user_id: user.id, preferred_method: form.preferredComm as any,
      });

      toast.success("Welcome to ProlificHire!");
      navigate("/dashboard");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
    setSaving(false);
  };

  const canNext = () => {
    if (step === 0) return form.firstName.trim() && form.lastName.trim() && form.phone.trim();
    if (step === 1) return form.orgName.trim();
    if (step === 3) return form.address.trim() && form.city.trim() && form.state.trim() && form.zip.trim() && form.county.trim();
    return true;
  };

  const validationMessage = () => {
    if (step === 0) {
      if (!form.firstName.trim()) return "First name is required";
      if (!form.lastName.trim()) return "Last name is required";
      if (!form.phone.trim()) return "Phone number is required";
    }
    if (step === 1 && !form.orgName.trim()) return "Farm or organization name is required";
    if (step === 3) {
      if (!form.address.trim()) return "Street address is required";
      if (!form.city.trim()) return "City is required";
      if (!form.state) return "State is required";
      if (!form.zip.trim()) return "ZIP code is required";
      if (!form.county.trim()) return "County is required for field and job routing";
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
        <span className="ml-3 text-xs text-muted-foreground">Hire Work — Setup your account</span>
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
              {step === 0 && "Tell us about yourself."}
              {step === 1 && "Set up your farm or organization."}
              {step === 2 && "Add billing and approval contacts."}
              {step === 3 && "Where is your farm headquarters? County is required for job routing."}
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
                  <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(555) 555-0100" />
                </div>
                <div className="space-y-1.5">
                  <Label>Your role</Label>
                  <Select value={form.role} onValueChange={v => set("role", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="tenant">Tenant</SelectItem>
                      <SelectItem value="farm_manager">Farm Manager</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Label>Organization / Farm name <span className="text-destructive">*</span></Label>
                  <Input value={form.orgName} onChange={e => set("orgName", e.target.value)} placeholder="e.g. Westfield Farms LLC" />
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={form.orgType} onValueChange={v => set("orgType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="farm">Farm / Ranch</SelectItem>
                      <SelectItem value="management">Management Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">Optional — you can add these later in Settings.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Billing contact name</Label>
                    <Input value={form.billingContactName} onChange={e => set("billingContactName", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Billing contact email</Label>
                    <Input type="email" value={form.billingContactEmail} onChange={e => set("billingContactEmail", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Approval contact name</Label>
                    <Input value={form.approvalContactName} onChange={e => set("approvalContactName", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Approval contact email</Label>
                    <Input type="email" value={form.approvalContactEmail} onChange={e => set("approvalContactEmail", e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Street address <span className="text-destructive">*</span></Label>
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
                  <Input value={form.county} onChange={e => set("county", e.target.value)} placeholder="e.g. Douglas" />
                  <p className="text-[11px] text-muted-foreground">Required — used for job routing and operator matching.</p>
                </div>
              </div>
            )}

            {/* Validation message */}
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
