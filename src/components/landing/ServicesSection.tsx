import { useRef } from "react";
import { Link } from "react-router-dom";
import { useScrollRevealAll } from "@/hooks/useScrollReveal";
import { SprayCan, Sprout, Wheat, Tractor, Mountain } from "lucide-react";

const services = [
  {
    icon: SprayCan,
    slug: "spraying",
    title: "Custom Spraying Services",
    desc: "Professional crop spraying, herbicide application, and fungicide programs executed by experienced operators with GPS-guided equipment. Whether you need pre-emerge, post-emerge, or late-season applications, ProlificHire connects you with licensed applicators who understand drift management, buffer zones, and restricted-entry intervals. Get variable-rate prescriptions applied accurately with full documentation.",
    keywords: "custom spraying, crop spraying near me, herbicide application, agricultural spraying services",
  },
  {
    icon: Sprout,
    slug: "planting",
    title: "Custom Planting Services",
    desc: "Find experienced planting operators equipped with modern planters, variable-rate drives, and precision seed placement technology. From corn and soybeans to wheat and specialty crops, our marketplace connects growers with operators who can handle any seed type, population target, and row spacing requirement. Upload your prescription maps and let operators execute with full data return.",
    keywords: "custom planting, planting services near me, seed planting, precision planting",
  },
  {
    icon: Wheat,
    slug: "harvest",
    title: "Custom Harvesting Services",
    desc: "Connect with harvest crews who bring combines, grain carts, and trucking capacity to your fields when timing matters most. ProlificHire handles field boundaries, moisture tracking, and yield data sharing so you get every bushel accounted for. Schedule crews weeks in advance or find last-minute availability when weather windows open.",
    keywords: "custom harvesting, harvest crews near me, combine services, grain harvesting",
  },
  {
    icon: Tractor,
    slug: "fertilizer",
    title: "Fertilizer Application Services",
    desc: "Dry spread, liquid application, anhydrous ammonia — whatever your fertility program calls for, ProlificHire connects you with operators who have the right equipment and certifications. Specify rates, zones, and product pickup logistics. Track every pass with as-applied maps tied directly to your field records for clean agronomic history.",
    keywords: "fertilizer application, custom fertilizer spreading, agricultural application services",
  },
  {
    icon: Mountain,
    slug: "rock-picking",
    title: "Rock Picking Services",
    desc: "Clear your fields of surface rocks before planting or after tillage with professional rock picking services. Operators bring rock pickers, skid steers, and hauling equipment to handle everything from scattered stones to heavy boulder fields. Specify density estimates, disposal preferences, and equipment requirements through structured job specs.",
    keywords: "rock picking services, field rock removal, agricultural rock picking",
  },
];

export default function ServicesSection() {
  const ref = useRef<HTMLElement>(null);
  useScrollRevealAll(ref);

  return (
    <section ref={ref} id="services" className="py-20 md:py-28">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <p className="reveal text-sm font-semibold text-accent uppercase tracking-wider mb-3">Services</p>
          <h2 className="reveal text-3xl md:text-4xl font-bold tracking-tight" style={{ transitionDelay: "80ms" }}>
            Hire custom farming services near you
          </h2>
          <p className="reveal mt-4 text-muted-foreground text-lg" style={{ transitionDelay: "120ms" }}>
            Find spraying, planting, harvest, rock picking, and more — all matched to your fields, crop, and schedule.
          </p>
        </div>

        <div className="space-y-10">
          {services.map((s, i) => (
            <article
              key={s.slug}
              className="reveal rounded-xl bg-card shadow-card p-6 md:p-8"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start gap-4 mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <s.icon size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{s.title}</h3>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-3xl">{s.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
