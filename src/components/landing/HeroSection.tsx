import { useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollRevealAll } from "@/hooks/useScrollReveal";
import heroImg from "@/assets/hero-aerial.jpg";

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  useScrollRevealAll(ref);

  return (
    <section ref={ref} className="relative pt-16 overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroImg} alt="" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/75 to-foreground/30" />
      </div>

      <div className="relative container py-20 md:py-28 lg:py-36">
        <div className="max-w-xl">
          <h1
            className="reveal text-3xl md:text-4xl lg:text-[3.25rem] font-bold tracking-tight text-primary-foreground leading-[1.1]"
            style={{ transitionDelay: "80ms" }}
          >
            Hire fieldwork.{" "}
            <span className="text-accent">Get it done.</span>
          </h1>

          <p
            className="reveal mt-5 text-base md:text-lg text-primary-foreground/70 max-w-md leading-relaxed"
            style={{ transitionDelay: "160ms" }}
          >
            The marketplace connecting growers with custom operators for spraying, planting, harvest, and more — organized around your fields.
          </p>

          <div className="reveal mt-7 flex flex-wrap gap-3" style={{ transitionDelay: "240ms" }}>
            <Button variant="hero" size="lg" asChild>
              <Link to="/signup">
                Create Free Account
                <ArrowRight size={16} className="ml-1" />
              </Link>
            </Button>
            <Button
              variant="hero-outline"
              size="lg"
              className="border-primary-foreground/25 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              asChild
            >
              <Link to="/marketplace">Browse Jobs</Link>
            </Button>
          </div>

          <div className="reveal mt-10 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-primary-foreground/55" style={{ transitionDelay: "320ms" }}>
            <span>✓ Free for growers to post</span>
            <span>✓ GPS-guided operators</span>
            <span>✓ Split payments built in</span>
          </div>
        </div>
      </div>
    </section>
  );
}
