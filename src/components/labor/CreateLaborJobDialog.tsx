import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateLaborJob } from "@/hooks/useLaborJobs";
import { useFields } from "@/hooks/useFields";
import { Plus, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STEPS = ["Type", "Details", "Schedule", "Compensation", "Review"];

const SKILL_OPTIONS = [
  "CDL", "Tractor Operation", "Sprayer Operation", "Combine Operation",
  "Truck Driving", "Grain Cart", "Irrigation", "Livestock",
  "Welding", "Mechanical Repair", "GPS/Precision Ag",
];

export function CreateLaborJobDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const createMutation = useCreateLaborJob();
  const { data: fields = [] } = useFields();

  const [form, setForm] = useState({
    title: "",
    description: "",
    responsibilities: "",
    job_type: "seasonal",
    required_skills: [] as string[],
    experience_level: "any",
    location_city: "",
    location_state: "",
    start_date: "",
    end_date: "",
    hours_per_day: 8,
    schedule_flexibility: "fixed",
    compensation_type: "hourly",
    compensation_min: undefined as number | undefined,
    compensation_max: undefined as number | undefined,
    housing_provided: false,
  });

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));
  const toggleSkill = (s: string) => {
    set("required_skills", form.required_skills.includes(s)
      ? form.required_skills.filter(x => x !== s)
      : [...form.required_skills, s]);
  };

  const canSubmit = form.title && form.compensation_type;

  const handleSubmit = async () => {
    try {
      await createMutation.mutateAsync(form as any);
      toast.success("Labor position posted!");
      setOpen(false);
      setStep(0);
      setForm({
        title: "", description: "", responsibilities: "", job_type: "seasonal",
        required_skills: [], experience_level: "any", location_city: "", location_state: "",
        start_date: "", end_date: "", hours_per_day: 8, schedule_flexibility: "fixed",
        compensation_type: "hourly", compensation_min: undefined, compensation_max: undefined,
        housing_provided: false,
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to post");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 text-xs gap-1"><Plus size={12} /> Post Position</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Post Labor Position</DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="flex items-center gap-1 mb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <button onClick={() => setStep(i)}
                className={cn("text-[10px] px-2 py-0.5 rounded-full transition-colors",
                  i === step ? "bg-primary text-primary-foreground" :
                  i < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}>
                {s}
              </button>
              {i < STEPS.length - 1 && <ChevronRight size={10} className="text-muted-foreground" />}
            </div>
          ))}
        </div>

        <div className="space-y-3 min-h-[200px]">
          {step === 0 && (
            <>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Position Type *</Label>
                <Select value={form.job_type} onValueChange={v => set("job_type", v)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full-Time</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                    <SelectItem value="part_time">Part-Time</SelectItem>
                    <SelectItem value="task">Task / Gig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Title *</Label>
                <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Seasonal Harvest Crew Member" className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Experience Level</Label>
                <Select value={form.experience_level} onValueChange={v => set("experience_level", v)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Level</SelectItem>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="experienced">Experienced</SelectItem>
                    <SelectItem value="senior">Senior / Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Description</Label>
                <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe the position…" className="text-xs min-h-[80px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Responsibilities</Label>
                <Textarea value={form.responsibilities} onChange={e => set("responsibilities", e.target.value)} placeholder="Key responsibilities…" className="text-xs min-h-[60px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Required Skills</Label>
                <div className="flex flex-wrap gap-1">
                  {SKILL_OPTIONS.map(s => (
                    <button key={s} onClick={() => toggleSkill(s)}
                      className={cn("text-[10px] px-2 py-1 rounded-full border transition-colors",
                        form.required_skills.includes(s)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground hover:text-foreground"
                      )}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px]">City</Label>
                  <Input value={form.location_city} onChange={e => set("location_city", e.target.value)} placeholder="City" className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px]">State</Label>
                  <Input value={form.location_state} onChange={e => set("location_state", e.target.value)} placeholder="State" className="h-9 text-xs" />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Start Date</Label>
                  <Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px]">End Date</Label>
                  <Input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} className="h-9 text-xs" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Hours per Day</Label>
                <Input type="number" value={form.hours_per_day} onChange={e => set("hours_per_day", Number(e.target.value))} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Schedule Flexibility</Label>
                <Select value={form.schedule_flexibility} onValueChange={v => set("schedule_flexibility", v)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Schedule</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                    <SelectItem value="variable">Variable / On-Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.housing_provided} onCheckedChange={v => set("housing_provided", v)} id="housing" />
                <Label htmlFor="housing" className="text-[11px] cursor-pointer">Housing provided</Label>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Compensation Type *</Label>
                <Select value={form.compensation_type} onValueChange={v => set("compensation_type", v)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="salary">Salary</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="per_task">Per Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Min Pay</Label>
                  <Input type="number" value={form.compensation_min || ""} onChange={e => set("compensation_min", Number(e.target.value) || undefined)} placeholder="$" className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Max Pay</Label>
                  <Input type="number" value={form.compensation_max || ""} onChange={e => set("compensation_max", Number(e.target.value) || undefined)} placeholder="$" className="h-9 text-xs" />
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium">Review your position:</p>
              <div className="rounded-md bg-muted/40 p-3 space-y-1.5 text-[11px]">
                <p><strong>Title:</strong> {form.title || "—"}</p>
                <p><strong>Type:</strong> {form.job_type}</p>
                <p><strong>Location:</strong> {form.location_city || "—"}{form.location_state ? `, ${form.location_state}` : ""}</p>
                <p><strong>Pay:</strong> {form.compensation_min ? `$${form.compensation_min}` : "—"}{form.compensation_max ? `–$${form.compensation_max}` : ""} {form.compensation_type}</p>
                <p><strong>Schedule:</strong> {form.hours_per_day}h/day · {form.schedule_flexibility}</p>
                {form.required_skills.length > 0 && <p><strong>Skills:</strong> {form.required_skills.join(", ")}</p>}
                {form.housing_provided && <p><strong>Housing:</strong> Provided</p>}
              </div>
            </div>
          )}
        </div>

        {/* Nav buttons */}
        <div className="flex justify-between pt-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1"
            onClick={() => setStep(s => s - 1)} disabled={step === 0}>
            <ChevronLeft size={12} /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button size="sm" className="h-8 text-xs gap-1" onClick={() => setStep(s => s + 1)}>
              Next <ChevronRight size={12} />
            </Button>
          ) : (
            <Button size="sm" className="h-8 text-xs gap-1" onClick={handleSubmit}
              disabled={!canSubmit || createMutation.isPending}>
              <Plus size={12} /> Post Position
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
