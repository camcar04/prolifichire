import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useApplyToJob, useMyApplications } from "@/hooks/useLaborJobs";
import {
  MapPin, Clock, DollarSign, Calendar, Briefcase,
  CheckCircle2, Home, Star, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-Time",
  seasonal: "Seasonal",
  part_time: "Part-Time",
  task: "Task / Gig",
};

const COMP_LABELS: Record<string, string> = {
  hourly: "/hr",
  salary: "/yr",
  per_task: "/task",
  daily: "/day",
};

export function LaborJobDetailPane({ job }: { job: any }) {
  const { user } = useAuth();
  const applyMutation = useApplyToJob();
  const { data: myApps = [] } = useMyApplications();
  const [coverNote, setCoverNote] = useState("");
  const [showApply, setShowApply] = useState(false);

  const alreadyApplied = myApps.some((a: any) => a.labor_job_id === job.id);

  const handleApply = async () => {
    try {
      await applyMutation.mutateAsync({ laborJobId: job.id, coverNote: coverNote || undefined });
      toast.success("Application submitted!");
      setShowApply(false);
      setCoverNote("");
    } catch (e: any) {
      toast.error(e.message || "Failed to apply");
    }
  };

  const skills = (job.required_skills || []) as string[];
  const certs = (job.required_certifications || []) as string[];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b space-y-2">
        <div className="flex items-center gap-2">
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded",
            job.job_type === "full_time" ? "bg-chart-1/10 text-chart-1" :
            job.job_type === "seasonal" ? "bg-chart-2/10 text-chart-2" :
            "bg-muted text-muted-foreground"
          )}>
            {JOB_TYPE_LABELS[job.job_type] || job.job_type}
          </span>
          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded",
            job.status === "open" ? "bg-chart-2/10 text-chart-2" : "bg-muted text-muted-foreground"
          )}>
            {job.status === "open" ? "Accepting Applications" : job.status}
          </span>
        </div>
        <h2 className="text-[16px] font-bold leading-tight">{job.title}</h2>
        {(job as any).farms?.name && (
          <p className="text-[12px] text-muted-foreground">{(job as any).farms.name}</p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Location", value: job.location_city ? `${job.location_city}${job.location_state ? `, ${job.location_state}` : ""}` : "Not specified", icon: MapPin },
            { label: "Compensation", value: job.compensation_min ? `$${job.compensation_min}${job.compensation_max && job.compensation_max !== job.compensation_min ? `–$${job.compensation_max}` : ""}${COMP_LABELS[job.compensation_type] || ""}` : "TBD", icon: DollarSign },
            { label: "Schedule", value: job.hours_per_day ? `${job.hours_per_day}h/day` : "Flexible", icon: Clock },
            { label: "Start Date", value: job.start_date ? new Date(job.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Flexible", icon: Calendar },
          ].map(k => (
            <div key={k.label} className="rounded-md bg-muted/40 p-2">
              <p className="text-[9px] text-muted-foreground flex items-center gap-1"><k.icon size={9} />{k.label}</p>
              <p className="text-[12px] font-semibold mt-0.5">{k.value}</p>
            </div>
          ))}
        </div>

        {job.housing_provided && (
          <div className="flex items-center gap-2 text-[11px] bg-chart-2/5 text-chart-2 rounded-md px-2.5 py-1.5">
            <Home size={11} /> Housing provided
          </div>
        )}

        {/* Description */}
        {job.description && (
          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Description</p>
            <p className="text-[12px] text-foreground/80 leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>
        )}

        {job.responsibilities && (
          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Responsibilities</p>
            <p className="text-[12px] text-foreground/80 leading-relaxed whitespace-pre-wrap">{job.responsibilities}</p>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1.5">Required Skills</p>
            <div className="flex flex-wrap gap-1">
              {skills.map(s => (
                <span key={s} className="text-[10px] bg-muted px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        )}

        {certs.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1.5">Required Certifications</p>
            <div className="flex flex-wrap gap-1">
              {certs.map(c => (
                <span key={c} className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star size={8} />{c}
                </span>
              ))}
            </div>
          </div>
        )}

        {job.experience_level && job.experience_level !== "any" && (
          <div className="flex items-center gap-2 text-[11px]">
            <Briefcase size={11} className="text-muted-foreground" />
            <span className="text-muted-foreground">Experience:</span>
            <span className="font-medium capitalize">{job.experience_level}</span>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="shrink-0 border-t bg-card p-3 space-y-2">
        {alreadyApplied ? (
          <div className="flex items-center gap-2 text-[12px] text-chart-2 font-medium justify-center py-2">
            <CheckCircle2 size={14} /> Applied
          </div>
        ) : showApply ? (
          <div className="space-y-2">
            <Textarea
              value={coverNote}
              onChange={e => setCoverNote(e.target.value)}
              placeholder="Optional: Add a note about why you're a great fit…"
              className="text-xs min-h-[60px]"
            />
            <div className="flex gap-2">
              <Button className="flex-1 h-9 text-xs gap-1" onClick={handleApply} disabled={applyMutation.isPending}>
                <Send size={12} /> Submit Application
              </Button>
              <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => setShowApply(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button className="w-full h-9 text-xs gap-1" onClick={() => setShowApply(true)}>
            <Send size={12} /> Apply Now
          </Button>
        )}
      </div>
    </div>
  );
}
