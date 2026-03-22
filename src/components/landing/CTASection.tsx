import { useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollRevealAll } from "@/hooks/useScrollReveal";

export default function CTASection() {
  const ref = useRef<HTMLElement>(null);
  useScrollRevealAll(ref);

  return (
    <section ref={ref} className="py-12 md:py-16 bg-primary">
      <div className="container text-center">
        <h2 className="reveal text-xl md:text-2xl font-bold tracking-tight text-primary-foreground">
          Ready to manage fieldwork, not paperwork?
        </h2>
        <p className="reveal mt-2.5 text-primary-foreground/60 text-[14px] max-w-md mx-auto" style={{ transitionDelay: "80ms" }}>
          Join growers and operators managing every acre, job, and dollar through ProlificHire.
        </p>
        <div className="reveal mt-5 flex justify-center gap-2.5" style={{ transitionDelay: "160ms" }}>
          <Button variant="hero" size="default" asChild>
            <Link to="/signup">
              Create Free Account
              <ArrowRight size={14} className="ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
