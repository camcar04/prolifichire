import { useRef } from "react";
import { useScrollRevealAll } from "@/hooks/useScrollReveal";
import {
  Map, Briefcase, FileStack, DollarSign, Shield, CalendarDays,
} from "lucide-react";

const features = [
  {
    icon: Map,
    title: "Field Workspaces",
    desc: "Every field gets a permanent workspace — boundaries, work history, files, financials, and permissions in one view.",
  },
  {
    icon: Briefcase,
    title: "Job Marketplace",
    desc: "Post work, get quotes, accept operators. Full field context before anyone commits.",
  },
  {
    icon: FileStack,
    title: "Field Packets",
    desc: "Auto-generated data bundles per job — boundaries, prescriptions, access notes — ready for download.",
  },
  {
    icon: DollarSign,
    title: "Payments & Splits",
    desc: "Per-acre, hourly, or flat-rate. Owner/tenant split payments and full reconciliation built in.",
  },
  {
    icon: Shield,
    title: "Compliance Tracking",
    desc: "Insurance verification, certification tracking, and audit logging across every interaction.",
  },
  {
    icon: CalendarDays,
    title: "Scheduling & Routing",
    desc: "Calendar dispatch with travel distance, weather delays, and route clustering for efficiency.",
  },
];

export default function FeaturesSection() {
  const ref = useRef<HTMLElement>(null);
  useScrollRevealAll(ref);

  return (
    <section ref={ref} id="features" className="py-16 md:py-22">
      <div className="container">
        <div className="max-w-lg mx-auto text-center mb-12">
          <h2 className="reveal text-2xl md:text-3xl font-bold tracking-tight">
            Built for how fieldwork actually happens
          </h2>
          <p className="reveal mt-3 text-muted-foreground text-[15px]" style={{ transitionDelay: "80ms" }}>
            Every feature organized around the field — not generic project management.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="reveal group rounded-lg bg-card p-5 shadow-card hover:shadow-card-hover transition-[box-shadow] duration-300"
              style={{ transitionDelay: `${i * 70}ms` }}
            >
              <div className="h-9 w-9 rounded-md bg-primary/8 flex items-center justify-center mb-3 group-hover:bg-primary/12 transition-colors">
                <f.icon size={18} className="text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1.5">{f.title}</h3>
              <p className="text-muted-foreground text-[13px] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
