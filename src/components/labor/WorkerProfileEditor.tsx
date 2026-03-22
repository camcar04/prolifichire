import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkerProfile, useUpsertWorkerProfile } from "@/hooks/useLaborJobs";
import { User, MapPin, Wrench, Calendar, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SKILL_OPTIONS = [
  "CDL", "Tractor Operation", "Sprayer Operation", "Combine Operation",
  "Truck Driving", "Grain Cart", "Irrigation", "Livestock",
  "Welding", "Mechanical Repair", "GPS/Precision Ag", "Planting",
  "Harvesting", "Hay/Baling", "Rock Picking", "Fencing",
];

const WORK_PREF_OPTIONS = ["full_time", "part_time", "seasonal", "task"];
const WORK_PREF_LABELS: Record<string, string> = {
  full_time: "Full-Time", part_time: "Part-Time", seasonal: "Seasonal", task: "Task / Gig",
};

export function WorkerProfileEditor() {
  const { data: existing, isLoading } = useWorkerProfile();
  const upsertMutation = useUpsertWorkerProfile();

  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    base_city: "",
    base_state: "",
    travel_radius: 50,
    availability_status: "available",
    skills: [] as string[],
    years_experience: 0,
    work_preferences: [] as string[],
    available_from: "",
    available_to: "",
    hours_per_day: 8,
    flexibility: "flexible",
  });

  useEffect(() => {
    if (existing) {
      setForm({
        display_name: existing.display_name || "",
        bio: existing.bio || "",
        base_city: existing.base_city || "",
        base_state: existing.base_state || "",
        travel_radius: existing.travel_radius || 50,
        availability_status: existing.availability_status || "available",
        skills: (existing.skills as string[]) || [],
        years_experience: existing.years_experience || 0,
        work_preferences: (existing.work_preferences as string[]) || [],
        available_from: existing.available_from || "",
        available_to: existing.available_to || "",
        hours_per_day: existing.hours_per_day || 8,
        flexibility: existing.flexibility || "flexible",
      });
    }
  }, [existing]);

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));
  const toggleSkill = (s: string) => set("skills", form.skills.includes(s) ? form.skills.filter(x => x !== s) : [...form.skills, s]);
  const togglePref = (p: string) => set("work_preferences", form.work_preferences.includes(p) ? form.work_preferences.filter(x => x !== p) : [...form.work_preferences, p]);

  const handleSave = async () => {
    try {
      await upsertMutation.mutateAsync(form);
      toast.success("Profile saved!");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  };

  if (isLoading) return <div className="p-4 text-[12px] text-muted-foreground">Loading profile…</div>;

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-2 mb-1">
        <User size={16} className="text-primary" />
        <h3 className="text-[14px] font-semibold">Worker Profile</h3>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px]">Display Name *</Label>
        <Input value={form.display_name} onChange={e => set("display_name", e.target.value)} placeholder="Your name or business name" className="h-9 text-xs" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px]">About</Label>
        <Textarea value={form.bio} onChange={e => set("bio", e.target.value)} placeholder="Brief summary of your experience…" className="text-xs min-h-[60px]" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] flex items-center gap-1"><MapPin size={10} /> City</Label>
          <Input value={form.base_city} onChange={e => set("base_city", e.target.value)} className="h-9 text-xs" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px]">State</Label>
          <Input value={form.base_state} onChange={e => set("base_state", e.target.value)} className="h-9 text-xs" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px]">Travel Radius (miles)</Label>
          <Input type="number" value={form.travel_radius} onChange={e => set("travel_radius", Number(e.target.value))} className="h-9 text-xs" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px]">Years Experience</Label>
          <Input type="number" value={form.years_experience} onChange={e => set("years_experience", Number(e.target.value))} className="h-9 text-xs" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px]">Availability Status</Label>
        <Select value={form.availability_status} onValueChange={v => set("availability_status", v)}>
          <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="busy">Busy</SelectItem>
            <SelectItem value="seasonal">Seasonal Only</SelectItem>
            <SelectItem value="not_available">Not Available</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] flex items-center gap-1"><Wrench size={10} /> Skills</Label>
        <div className="flex flex-wrap gap-1">
          {SKILL_OPTIONS.map(s => (
            <button key={s} onClick={() => toggleSkill(s)}
              className={cn("text-[10px] px-2 py-1 rounded-full border transition-colors",
                form.skills.includes(s) ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground hover:text-foreground"
              )}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] flex items-center gap-1"><Calendar size={10} /> Work Preferences</Label>
        <div className="flex flex-wrap gap-1">
          {WORK_PREF_OPTIONS.map(p => (
            <button key={p} onClick={() => togglePref(p)}
              className={cn("text-[10px] px-2 py-1 rounded-full border transition-colors",
                form.work_preferences.includes(p) ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground hover:text-foreground"
              )}>
              {WORK_PREF_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px]">Available From</Label>
          <Input type="date" value={form.available_from} onChange={e => set("available_from", e.target.value)} className="h-9 text-xs" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px]">Available To</Label>
          <Input type="date" value={form.available_to} onChange={e => set("available_to", e.target.value)} className="h-9 text-xs" />
        </div>
      </div>

      <Button onClick={handleSave} disabled={upsertMutation.isPending} className="h-9 text-xs gap-1">
        <Save size={12} /> Save Profile
      </Button>
    </div>
  );
}
