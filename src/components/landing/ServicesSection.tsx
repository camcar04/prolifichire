import { useRef } from "react";
import { useScrollRevealAll } from "@/hooks/useScrollReveal";
import { SprayCan, Sprout, Wheat, Tractor, Mountain, Truck } from "lucide-react";

const services = [
  {
    icon: SprayCan,
    title: "Custom Spraying",
    desc: "Herbicide, fungicide, and foliar applications by licensed operators with GPS-guided equipment. Variable-rate prescriptions, drift management, and full as-applied documentation.",
  },
  {
    icon: Sprout,
    title: "Custom Planting",
    desc: "Precision seed placement with modern planters. Variable-rate population, any row spacing, and complete data return including as-planted maps.",
  },
  {
    icon: Wheat,
    title: "Custom Harvesting",
    desc: "Combines, grain carts, and trucking coordinated through one platform. Yield data sharing, moisture tracking, and field-by-field accounting.",
  },
  {
    icon: Truck,
    title: "Grain Hauling / Semi Support",
    desc: "Find trucks when you need them most. Post hauling jobs during harvest, match with nearby truckers, and coordinate loads, routes, and delivery destinations in real time.",
  },
  {
    icon: Tractor,
    title: "Fertilizer Application",
    desc: "Dry spread, liquid, and anhydrous programs. Specify rates, zones, and product pickup logistics with as-applied records tied to each field.",
  },
  {
    icon: Mountain,
    title: "Rock Picking",
    desc: "Clear fields before planting or after tillage. Specify density, disposal preferences, and equipment requirements through structured job specs.",
  },
];

export default function ServicesSection() {
  const ref = useRef<HTMLElement>(null);
  useScrollRevealAll(ref);

  return (
    <section ref={ref} id="services" className="py-16 md:py-22 bg-primary/[0.04]">
      <div className="container">
        <div className="max-w-lg mx-auto text-center mb-12">
          <h2 className="reveal text-2xl md:text-3xl font-bold tracking-tight">
            Hire custom farming services near you
          </h2>
          <p className="reveal mt-3 text-muted-foreground text-[15px]" style={{ transitionDelay: "80ms" }}>
            Spraying, planting, harvest, grain hauling, fertilizer, rock picking — matched to your fields.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s, i) => (
            <article
              key={s.title}
              className="reveal rounded-lg bg-card shadow-card p-5"
              style={{ transitionDelay: `${i * 70}ms` }}
            >
              <div className="flex items-center gap-3 mb-2.5">
                <div className="h-8 w-8 rounded-md bg-primary/8 flex items-center justify-center shrink-0">
                  <s.icon size={16} className="text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{s.title}</h3>
              </div>
              <p className="text-muted-foreground text-[13px] leading-relaxed">{s.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
