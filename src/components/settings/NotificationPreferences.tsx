import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const PREFS = [
  { key: "notify_quotes", label: "Quote events", desc: "New quotes, accepted, declined" },
  { key: "notify_scheduling", label: "Scheduling events", desc: "Job scheduled, rescheduled" },
  { key: "notify_delays", label: "Delay notices", desc: "Weather delays, exceptions" },
  { key: "notify_packets", label: "Field packet readiness", desc: "Packet generated, ready for download" },
  { key: "notify_approvals", label: "Completion approvals", desc: "Proof submitted, approved" },
  { key: "notify_invoices", label: "Invoice & payment updates", desc: "Invoice sent, payment received" },
  { key: "notify_payouts", label: "Payout updates", desc: "Payout initiated, completed" },
  { key: "notify_contracts", label: "Contract & signature requests", desc: "Signature needed, signed" },
] as const;

export function NotificationPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Record<string, any>>({
    preferred_method: "in_app",
    alternate_phone: "",
    quiet_hours_start: "",
    quiet_hours_end: "",
    ...Object.fromEntries(PREFS.map(p => [p.key, true])),
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("communication_preferences").select("*").eq("user_id", user.id).single()
      .then(({ data }) => {
        if (data) setPrefs(data as any);
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("communication_preferences").upsert({
      user_id: user.id,
      ...prefs,
    } as any, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Preferences saved");
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">Communication Method</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Preferred method</Label>
            <Select value={prefs.preferred_method} onValueChange={v => setPrefs(p => ({ ...p, preferred_method: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in_app">In-App</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Alternate phone</Label>
            <Input value={prefs.alternate_phone || ""} onChange={e => setPrefs(p => ({ ...p, alternate_phone: e.target.value }))} placeholder="(555) 555-0100" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-1">Quiet Hours</h3>
        <p className="text-xs text-muted-foreground mb-3">No notifications during these hours.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Start</Label>
            <Input type="time" value={prefs.quiet_hours_start || ""} onChange={e => setPrefs(p => ({ ...p, quiet_hours_start: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>End</Label>
            <Input type="time" value={prefs.quiet_hours_end || ""} onChange={e => setPrefs(p => ({ ...p, quiet_hours_end: e.target.value }))} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Notification Types</h3>
        <div className="space-y-1">
          {PREFS.map(p => (
            <div key={p.key} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors">
              <div>
                <p className="text-sm font-medium">{p.label}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
              <Switch
                checked={prefs[p.key] !== false}
                onCheckedChange={v => setPrefs(prev => ({ ...prev, [p.key]: v }))}
              />
            </div>
          ))}
        </div>
      </div>

      <Button onClick={save} disabled={saving}>
        {saving && <Loader2 size={16} className="animate-spin mr-2" />}
        Save Preferences
      </Button>
    </div>
  );
}
