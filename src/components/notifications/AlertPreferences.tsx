import { useState } from "react";
import { useAlertRules } from "@/hooks/useNotifications";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OperationType } from "@/types/domain";

const OPERATION_TYPES: { value: OperationType; label: string }[] = [
  { value: "spraying", label: "Spraying" },
  { value: "planting", label: "Planting" },
  { value: "harvest", label: "Harvest" },
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

export function AlertPreferences() {
  const { upsertRule } = useAlertRules();
  const [saving, setSaving] = useState(false);

  const [config, setConfig] = useState({
    enabled: true,
    operationTypes: [] as string[],
    maxRadius: "75",
    minAcres: "0",
    frequency: "instant",
    channels: ["in_app"] as string[],
  });

  const toggleOp = (op: string) => {
    setConfig((c) => ({
      ...c,
      operationTypes: c.operationTypes.includes(op)
        ? c.operationTypes.filter((o) => o !== op)
        : [...c.operationTypes, op],
    }));
  };

  const toggleChannel = (ch: string) => {
    setConfig((c) => ({
      ...c,
      channels: c.channels.includes(ch)
        ? c.channels.filter((x) => x !== ch)
        : [...c.channels, ch],
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await upsertRule.mutateAsync({
        rule_type: "job_match",
        conditions: {
          operation_types: config.operationTypes,
          max_radius_miles: parseInt(config.maxRadius) || 75,
          min_acres: parseInt(config.minAcres) || 0,
        },
        channels: config.channels,
        frequency: config.frequency,
        is_active: config.enabled,
      });
      toast.success("Alert preferences saved");
    } catch {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Bell size={15} /> Job Match Alerts
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Get notified when new jobs match your profile.
          </p>
        </div>
        <Switch
          checked={config.enabled}
          onCheckedChange={(v) => setConfig((c) => ({ ...c, enabled: v }))}
        />
      </div>

      {config.enabled && (
        <>
          <div>
            <Label className="mb-2 block">Operation Types</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {OPERATION_TYPES.map((op) => (
                <label
                  key={op.value}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors text-sm",
                    config.operationTypes.includes(op.value)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <Checkbox
                    checked={config.operationTypes.includes(op.value)}
                    onCheckedChange={() => toggleOp(op.value)}
                  />
                  {op.label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Max distance (miles)</Label>
              <Input
                type="number"
                value={config.maxRadius}
                onChange={(e) => setConfig((c) => ({ ...c, maxRadius: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Min acres</Label>
              <Input
                type="number"
                value={config.minAcres}
                onChange={(e) => setConfig((c) => ({ ...c, minAcres: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Alert frequency</Label>
            <Select value={config.frequency} onValueChange={(v) => setConfig((c) => ({ ...c, frequency: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant</SelectItem>
                <SelectItem value="hourly">Hourly digest</SelectItem>
                <SelectItem value="daily">Daily digest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block">Delivery channels</Label>
            <div className="flex gap-3">
              {[
                { key: "in_app", label: "In-App" },
                { key: "email", label: "Email" },
                { key: "sms", label: "SMS" },
              ].map((ch) => (
                <label
                  key={ch.key}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors text-sm",
                    config.channels.includes(ch.key)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <Checkbox
                    checked={config.channels.includes(ch.key)}
                    onCheckedChange={() => toggleChannel(ch.key)}
                  />
                  {ch.label}
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      <Button onClick={save} disabled={saving}>
        {saving && <Loader2 size={16} className="animate-spin mr-2" />}
        Save Alert Preferences
      </Button>
    </div>
  );
}
