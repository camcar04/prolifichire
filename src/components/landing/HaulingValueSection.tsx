import { useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useScrollRevealAll } from "@/hooks/useScrollReveal";
import { Truck, ArrowRight } from "lucide-react";

export default function HaulingValueSection() {
  const ref = useRef<HTMLElement>(null);
  useScrollRevealAll(ref);

  return (
    <section ref={ref} className="py-14 md:py-20 bg-primary/[0.04]">
      <div className="container max-w-3xl text-center">
        <Truck size={24} className="reveal text-primary mx-auto mb-3" />
        <h2 className="reveal text-2xl md:text-3xl font-bold tracking-tight" style={{ transitionDelay: "60ms" }}>
          Fix harvest bottlenecks
        </h2>
        <p className="reveal mt-3 text-muted-foreground text-[14px] max-w-md mx-auto leading-relaxed" style={{ transitionDelay: "120ms" }}>
          Coordinate trucks in real time. Fill gaps instantly. Keep combines running. Manage hauling inside your network or open demand to the marketplace.
        </p>
        <div className="reveal mt-5" style={{ transitionDelay: "180ms" }}>
          <Button variant="outline" size="sm" asChild>
            <Link to="/marketplace">
              Manage Hauling
              <ArrowRight size={14} className="ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
