import { useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollRevealAll } from "@/hooks/useScrollReveal";

export default function CTASection() {
  const ref = useRef<HTMLElement>(null);
  useScrollRevealAll(ref);

  return (
    <section ref={ref} className="py-16 md:py-24 bg-primary">
      <div className="container text-center">
        <h2 className="reveal text-2xl md:text-3xl font-bold tracking-tight text-primary-foreground">
          Ready to manage fieldwork, not paperwork?
        </h2>
        <p className="reveal mt-3 text-primary-foreground/65 text-[15px] max-w-md mx-auto" style={{ transitionDelay: "80ms" }}>
          Join growers and operators managing every acre, job, and dollar through ProlificHire.
        </p>
        <div className="reveal mt-6 flex justify-center gap-3" style={{ transitionDelay: "160ms" }}>
          <Button variant="hero" size="lg" asChild>
            <Link to="/signup">
              Create Free Account
              <ArrowRight size={16} className="ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
