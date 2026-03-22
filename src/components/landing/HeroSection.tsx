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
    <section ref={ref} className="relative pt-14 overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroImg} alt="" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/92 via-foreground/80 to-foreground/40" />
      </div>

      <div className="relative container py-16 md:py-24 lg:py-32">
        <div className="max-w-lg">
          <h1
            className="reveal text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-primary-foreground"
            style={{ lineHeight: 1.12, transitionDelay: "80ms" }}
          >
            Run your farm work.{" "}
            <span className="text-accent">Or power your entire network.</span>
          </h1>

          <p
            className="reveal mt-4 text-[15px] md:text-base text-primary-foreground/65 max-w-md leading-relaxed"
            style={{ transitionDelay: "160ms" }}
          >
            Manage farm work, coordinate operators, and run your entire network — growers, crews, and logistics — all in one platform.
          </p>

          <div className="reveal mt-6 flex flex-wrap gap-2.5" style={{ transitionDelay: "240ms" }}>
            <Button variant="hero" size="default" asChild>
              <Link to="/signup">
                Post a Job
                <ArrowRight size={14} className="ml-1" />
              </Link>
            </Button>
            <Button
              variant="hero-outline"
              size="default"
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              asChild
            >
              <Link to="/marketplace">Find Work</Link>
            </Button>
            <Button
              variant="hero-outline"
              size="default"
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              asChild
            >
              <Link to="/enterprise">Start a Network</Link>
            </Button>
          </div>

          <div className="reveal mt-8 flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-primary-foreground/50" style={{ transitionDelay: "320ms" }}>
            <span>✓ Free for growers to post</span>
            <span>✓ GPS-guided operators</span>
            <span>✓ Split payments built in</span>
          </div>
        </div>
      </div>
    </section>
  );
}
