import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { User, Bell, Shield, CreditCard } from "lucide-react";

export default function Settings() {
  const { profile } = useAuth();

  return (
    <AppShell title="Settings">
      <div className="max-w-2xl space-y-6 animate-fade-in">
        {/* Profile */}
        <section className="rounded-lg bg-card shadow-card p-5">
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

        {/* Notifications */}
        <section className="rounded-lg bg-card shadow-card p-5">
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

        {/* Security */}
        <section className="rounded-lg bg-card shadow-card p-5">
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

        {/* Billing */}
        <section className="rounded-lg bg-card shadow-card p-5">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-4"><CreditCard size={14} /> Billing & Payments</h2>
          <p className="text-[13px] text-muted-foreground">Payment method and billing settings will be available when Stripe Connect is configured.</p>
        </section>
      </div>
    </AppShell>
  );
}
