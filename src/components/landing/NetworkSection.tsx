import { useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useScrollRevealAll } from "@/hooks/useScrollReveal";
import { ArrowRight, Lock, Shield, Network, Truck, CheckCircle2, BarChart3 } from "lucide-react";

const points = [
  { icon: Lock, text: "Private network control — jobs stay internal unless you choose otherwise" },
  { icon: Shield, text: "Operator approval and credential verification built in" },
  { icon: Network, text: "Internal job routing with intelligent matching" },
  { icon: Truck, text: "Logistics and hauling coordination across your network" },
  { icon: CheckCircle2, text: "Payment and record tracking tied to every job" },
  { icon: BarChart3, text: "Full visibility into performance, volume, and revenue" },
];

export default function NetworkSection() {
  const ref = useRef<HTMLElement>(null);
  useScrollRevealAll(ref);

  return (
    <section ref={ref} id="networks" className="py-16 md:py-22 bg-foreground text-primary-foreground">
      <div className="container">
        <div className="max-w-lg mx-auto text-center mb-10">
          <h2 className="reveal text-2xl md:text-3xl font-bold tracking-tight">
            Built for ag networks
          </h2>
          <p className="reveal mt-3 text-primary-foreground/60 text-[15px]" style={{ transitionDelay: "80ms" }}>
            Retailers, co-ops, ethanol plants, and grain handlers — manage growers and operators in one system.
          </p>
        </div>

        <div className="reveal grid sm:grid-cols-2 gap-x-6 gap-y-3 max-w-2xl mx-auto" style={{ transitionDelay: "120ms" }}>
          {points.map((p) => (
            <div key={p.text} className="flex items-start gap-2.5">
              <p.icon size={15} className="text-accent mt-0.5 shrink-0" />
              <p className="text-[13px] text-primary-foreground/55 leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>

        <div className="reveal mt-8 text-center" style={{ transitionDelay: "200ms" }}>
          <Button variant="outline" size="sm" asChild>
            <Link to="/enterprise">
              Learn about Enterprise Networks
              <ArrowRight size={14} className="ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
