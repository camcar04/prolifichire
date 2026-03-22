import { useRef } from "react";
import { useScrollRevealAll } from "@/hooks/useScrollReveal";

const steps = [
  {
    num: "01",
    title: "Add Your Fields",
    desc: "Upload boundaries via shapefile, GeoJSON, or draw on the map. We calculate acreage and create the workspace automatically.",
  },
  {
    num: "02",
    title: "Post or Browse Work",
    desc: "Growers define jobs with timing, pricing, and requirements. Operators browse by location, crop, and service type.",
  },
  {
    num: "03",
    title: "Execute with Field Packets",
    desc: "On acceptance, a complete field packet is generated — boundaries, prescriptions, access notes — ready to download.",
  },
  {
    num: "04",
    title: "Approve & Pay",
    desc: "Operators submit proof of work. Growers review, approve, and payment flows automatically — including split payments.",
  },
];

export default function HowItWorksSection() {
  const ref = useRef<HTMLElement>(null);
  useScrollRevealAll(ref);

  return (
    <section ref={ref} id="how-it-works" className="py-24 md:py-32">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="reveal text-sm font-semibold text-accent uppercase tracking-wider mb-3">Workflow</p>
          <h2 className="reveal text-3xl md:text-4xl font-bold tracking-tight" style={{ transitionDelay: "80ms" }}>
            From field boundary to payment in four steps
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <div
              key={s.num}
              className="reveal relative"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <span className="text-5xl font-bold text-primary/8 tabular">{s.num}</span>
              <h3 className="font-semibold text-lg mt-2 mb-2">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 -right-4 w-8 border-t border-dashed border-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
