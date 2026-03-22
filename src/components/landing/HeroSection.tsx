import { useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Shield, Zap } from "lucide-react";
import { useScrollRevealAll } from "@/hooks/useScrollReveal";
import heroImg from "@/assets/hero-aerial.jpg";

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  useScrollRevealAll(ref);

  return (
    <section ref={ref} className="relative pt-16 overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/70 to-foreground/40" />
      </div>

      <div className="relative container py-24 md:py-32 lg:py-40">
        <div className="max-w-2xl">
          <div className="reveal flex items-center gap-2 mb-6">
            <span className="inline-flex items-center rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent">
              Field-Centric Operations
            </span>
          </div>

          <h1 className="reveal text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary-foreground leading-[1.08]" style={{ transitionDelay: "80ms" }}>
            The operating system for agricultural fieldwork
          </h1>

          <p className="reveal mt-6 text-lg md:text-xl text-primary-foreground/75 max-w-xl leading-relaxed" style={{ transitionDelay: "160ms" }}>
            Connect growers and custom operators. Manage jobs, field data, and payments — all tied to the field where work happens.
          </p>

          <div className="reveal mt-8 flex flex-wrap gap-3" style={{ transitionDelay: "240ms" }}>
            <Button variant="hero" size="xl" asChild>
              <Link to="/dashboard">
                Start Managing Fields
                <ArrowRight size={18} />
              </Link>
            </Button>
            <Button variant="hero-outline" size="xl" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild>
              <Link to="/marketplace">Browse Marketplace</Link>
            </Button>
          </div>

          <div className="reveal mt-12 flex flex-wrap gap-6" style={{ transitionDelay: "320ms" }}>
            {[
              { icon: MapPin, label: "Field-centric workspace" },
              { icon: Shield, label: "Compliance tracking" },
              { icon: Zap, label: "Instant field packets" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm text-primary-foreground/65">
                <item.icon size={16} className="text-accent" />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
