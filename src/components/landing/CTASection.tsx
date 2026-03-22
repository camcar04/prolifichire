import { useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollRevealAll } from "@/hooks/useScrollReveal";

export default function CTASection() {
  const ref = useRef<HTMLElement>(null);
  useScrollRevealAll(ref);

  return (
    <section ref={ref} className="py-24 md:py-32 bg-primary">
      <div className="container text-center">
        <h2 className="reveal text-3xl md:text-4xl font-bold tracking-tight text-primary-foreground">
          Ready to modernize your field operations?
        </h2>
        <p className="reveal mt-4 text-primary-foreground/70 text-lg max-w-xl mx-auto" style={{ transitionDelay: "80ms" }}>
          Join growers and operators who manage every acre, job, and dollar through ProlificHire.
        </p>
        <div className="reveal mt-8 flex justify-center gap-3" style={{ transitionDelay: "160ms" }}>
          <Button variant="hero" size="xl" asChild>
            <Link to="/dashboard">
              Get Started Free
              <ArrowRight size={18} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
