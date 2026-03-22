import { useRef } from "react";
import { useScrollRevealAll } from "@/hooks/useScrollReveal";

const steps = [
  {
    num: "1",
    title: "Add your fields",
    desc: "Upload shapefile, GeoJSON, or draw on the map. Acreage calculated automatically.",
  },
  {
    num: "2",
    title: "Post or browse work",
    desc: "Growers define jobs with timing and pricing. Operators browse by location and service type.",
  },
  {
    num: "3",
    title: "Execute with field packets",
    desc: "On acceptance, a complete data bundle is generated — boundaries, prescriptions, access notes.",
  },
  {
    num: "4",
    title: "Approve and pay",
    desc: "Operators submit proof. Growers approve, and payment flows — including owner/tenant splits.",
  },
];

export default function HowItWorksSection() {
  const ref = useRef<HTMLElement>(null);
  useScrollRevealAll(ref);

  return (
    <section ref={ref} id="how-it-works" className="py-20 md:py-28">
      <div className="container">
        <div className="max-w-lg mx-auto text-center mb-12">
          <h2 className="reveal text-2xl md:text-3xl font-bold tracking-tight">
            Field boundary to payment in four steps
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div
              key={s.num}
              className="reveal relative"
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold mb-3">
                {s.num}
              </div>
              <h3 className="font-semibold text-sm mb-1.5">{s.title}</h3>
              <p className="text-muted-foreground text-[13px] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
