import { useRef } from "react";
import { useScrollRevealAll } from "@/hooks/useScrollReveal";
import {
  Map, Briefcase, FileStack, DollarSign, Shield, CalendarDays,
} from "lucide-react";

const features = [
  {
    icon: Map,
    title: "Field Workspaces",
    desc: "Every field gets a permanent digital workspace — boundary maps, work history, files, financials, and permissions in one place.",
  },
  {
    icon: Briefcase,
    title: "Job Marketplace",
    desc: "Growers post work, operators browse and accept. Full context on every field before commitment.",
  },
  {
    icon: FileStack,
    title: "Field Packets",
    desc: "Auto-generated data bundles per job — boundaries, prescriptions, and access instructions ready for download.",
  },
  {
    icon: DollarSign,
    title: "Financial Engine",
    desc: "Per-acre, hourly, or flat-rate pricing. Split payments, change orders, and full reconciliation built in.",
  },
  {
    icon: Shield,
    title: "Trust & Compliance",
    desc: "Insurance verification, certification tracking, and audit logging across every interaction.",
  },
  {
    icon: CalendarDays,
    title: "Scheduling & Routing",
    desc: "Calendar-based dispatch with travel distance, weather delays, and route clustering for efficiency.",
  },
];

export default function FeaturesSection() {
  const ref = useRef<HTMLElement>(null);
  useScrollRevealAll(ref);

  return (
    <section ref={ref} id="features" className="py-24 md:py-32 bg-surface-2">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="reveal text-sm font-semibold text-accent uppercase tracking-wider mb-3">Platform Capabilities</p>
          <h2 className="reveal text-3xl md:text-4xl font-bold tracking-tight" style={{ transitionDelay: "80ms" }}>
            Built for how agricultural work actually happens
          </h2>
          <p className="reveal mt-4 text-muted-foreground text-lg" style={{ transitionDelay: "120ms" }}>
            Every feature designed around the field — not generic project management bolted onto agriculture.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="reveal group rounded-xl bg-card p-6 shadow-card hover:shadow-card-hover transition-[box-shadow] duration-300"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <f.icon size={20} className="text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
