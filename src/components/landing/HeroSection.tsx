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
      {/* Background image with solid dark overlay */}
      <div className="absolute inset-0">
        <img src={heroImg} alt="" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/90 to-black/80" />
      </div>

      <div className="relative container py-20 md:py-28 lg:py-36">
        <div className="max-w-lg">
          <h1
            className="reveal text-3xl sm:text-4xl md:text-[2.75rem] lg:text-5xl font-bold tracking-tight text-white drop-shadow-lg"
            style={{ lineHeight: 1.1, transitionDelay: "80ms", textShadow: "0 2px 12px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5)" }}
          >
            Run your farm work.{" "}
            <span className="text-[hsl(83,55%,55%)]">Or power your entire network.</span>
          </h1>

          <p
            className="reveal mt-5 text-base md:text-lg text-white max-w-md leading-relaxed font-medium"
            style={{ transitionDelay: "160ms", textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}
          >
            Manage farm work, coordinate operators, and run your entire network — growers, crews, and logistics — all in one platform.
          </p>

          <div className="reveal mt-7 flex flex-wrap gap-3" style={{ transitionDelay: "240ms" }}>
            <Button variant="hero" size="lg" asChild>
              <Link to="/signup">
                Post a Job
                <ArrowRight size={16} className="ml-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              className="bg-white/15 backdrop-blur-sm text-white border border-white/25 hover:bg-white/25 hover:text-white font-semibold"
              asChild
            >
              <Link to="/marketplace">Find Work</Link>
            </Button>
            <Button
              size="lg"
              className="bg-white/15 backdrop-blur-sm text-white border border-white/25 hover:bg-white/25 hover:text-white font-semibold"
              asChild
            >
              <Link to="/enterprise">Start a Network</Link>
            </Button>
          </div>

          <div className="reveal mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-white/70 font-medium" style={{ transitionDelay: "320ms" }}>
            <span>✓ Free for growers to post</span>
            <span>✓ GPS-guided operators</span>
            <span>✓ Split payments built in</span>
          </div>
        </div>
      </div>
    </section>
  );
}
