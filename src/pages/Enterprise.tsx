import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useScrollRevealAll } from "@/hooks/useScrollReveal";
import {
  ArrowRight, Shield, Network, Truck, BarChart3, Lock,
  Users, CheckCircle2, Building2, Wheat, Factory, Warehouse,
} from "lucide-react";

function HeroEnterprise() {
  const ref = useRef<HTMLElement>(null);
  useScrollRevealAll(ref);
  return (
    <section ref={ref} className="pt-14 bg-primary">
      <div className="container py-20 md:py-28 lg:py-36">
        <div className="max-w-2xl">
          <h1
            className="reveal text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-primary-foreground"
            style={{ lineHeight: 1.08, transitionDelay: "80ms" }}
          >
            Run your entire ag network in one platform
          </h1>
          <p
            className="reveal mt-5 text-[15px] md:text-base text-primary-foreground/60 max-w-lg leading-relaxed"
            style={{ transitionDelay: "160ms" }}
          >
            Coordinate growers, operators, and logistics while keeping full control of your network. Built for retailers, co-ops, ethanol plants, and grain handlers.
          </p>
          <div className="reveal mt-7 flex flex-wrap gap-3" style={{ transitionDelay: "240ms" }}>
            <Button variant="hero" size="default" asChild>
              <Link to="/signup">
                Start Your Network
                <ArrowRight size={14} className="ml-1" />
              </Link>
            </Button>
            <Button
              variant="hero-outline"
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              asChild
            >
              <Link to="/marketplace">Explore Marketplace</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const ref = useRef<HTMLElement>(null);
  useScrollRevealAll(ref);
  const problems = [
    { title: "Disconnected communication", desc: "Phone calls, texts, and spreadsheets scattered across your operation." },
    { title: "No visibility", desc: "You don't know what's happening in the field until someone calls you." },
    { title: "Inefficient coordination", desc: "Matching operators to fields takes hours of manual work every season." },
    { title: "Trucking bottlenecks", desc: "Combines sit idle waiting for trucks. Every hour of downtime costs money." },
  ];
  return (
    <section ref={ref} className="py-16 md:py-24">
      <div className="container">
        <h2 className="reveal text-2xl md:text-3xl font-bold tracking-tight text-center">
          The coordination problem in agriculture
        </h2>
        <p className="reveal mt-3 text-muted-foreground text-center max-w-md mx-auto text-[14px]" style={{ transitionDelay: "80ms" }}>
          Networks lose time and revenue when coordination lives in phone calls and paper.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mt-10 max-w-3xl mx-auto">
          {problems.map((p, i) => (
            <div key={p.title} className="reveal rounded-lg border p-5" style={{ transitionDelay: `${i * 70}ms` }}>
              <h3 className="font-semibold text-sm mb-1">{p.title}</h3>
              <p className="text-muted-foreground text-[13px] leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SolutionSection() {
  const ref = useRef<HTMLElement>(null);
  useScrollRevealAll(ref);
  const solutions = [
    { icon: Network, title: "Centralized coordination", desc: "One platform for growers, operators, truckers, and admin staff." },
    { icon: Lock, title: "Internal job marketplace", desc: "Route jobs inside your network first. Open to public only when needed." },
    { icon: Truck, title: "Logistics management", desc: "Coordinate hauling demand, assign trucks, and track loads in real time." },
    { icon: BarChart3, title: "Payment & performance tracking", desc: "Invoices, payouts, and analytics tied to every job and field." },
  ];
  return (
    <section ref={ref} className="py-16 md:py-24 bg-surface-2">
      <div className="container">
        <h2 className="reveal text-2xl md:text-3xl font-bold tracking-tight text-center">
          One platform to run it all
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 mt-10 max-w-3xl mx-auto">
          {solutions.map((s, i) => (
            <div key={s.title} className="reveal rounded-lg bg-card border p-5" style={{ transitionDelay: `${i * 70}ms` }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-md bg-primary/8 flex items-center justify-center shrink-0">
                  <s.icon size={16} className="text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{s.title}</h3>
              </div>
              <p className="text-muted-foreground text-[13px] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksEnterprise() {
  const ref = useRef<HTMLElement>(null);
  useScrollRevealAll(ref);
  const steps = [
    { num: "1", title: "Build your network", desc: "Create your organization account and set network rules — credentials, job types, pricing visibility." },
    { num: "2", title: "Invite growers and operators", desc: "Add your existing relationships. Approve new members before they can participate." },
    { num: "3", title: "Manage jobs internally", desc: "Route work through your network first. Control who sees what, and enforce quality standards." },
    { num: "4", title: "Expand when needed", desc: "Open jobs to the public marketplace to fill gaps. Hybrid mode gives you both control and reach." },
  ];
  return (
    <section ref={ref} className="py-16 md:py-24">
      <div className="container">
        <h2 className="reveal text-2xl md:text-3xl font-bold tracking-tight text-center mb-10">
          How enterprise networks work
        </h2>
        <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {steps.map((s, i) => (
            <div key={s.num} className="reveal" style={{ transitionDelay: `${i * 90}ms` }}>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold mb-3">
                {s.num}
              </div>
              <h3 className="font-semibold text-sm mb-1.5">{s.title}</h3>
              <p className="text-muted-foreground text-[13px] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesGrid() {
  const ref = useRef<HTMLElement>(null);
  useScrollRevealAll(ref);
  const features = [
    { icon: Lock, title: "Private network control", desc: "Jobs stay inside your network unless you choose to open them." },
    { icon: Shield, title: "Operator verification", desc: "Enforce credential requirements. CDL, applicator licenses, insurance — all tracked." },
    { icon: Network, title: "Job routing", desc: "Intelligent matching within your network based on proximity, equipment, and availability." },
    { icon: Truck, title: "Hauling coordination", desc: "Manage trucking demand, assign capacity, and keep combines running." },
    { icon: CheckCircle2, title: "Payments & contracts", desc: "Digital contracts, split payments, and full invoice-to-payout tracking." },
    { icon: BarChart3, title: "Analytics dashboard", desc: "Job volume, operator utilization, revenue, and performance — all in one view." },
  ];
  return (
    <section ref={ref} className="py-16 md:py-24 bg-surface-2">
      <div className="container">
        <h2 className="reveal text-2xl md:text-3xl font-bold tracking-tight text-center mb-10">
          Everything your network needs
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {features.map((f, i) => (
            <div key={f.title} className="reveal rounded-lg bg-card border p-5" style={{ transitionDelay: `${i * 60}ms` }}>
              <f.icon size={18} className="text-primary mb-2.5" />
              <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-muted-foreground text-[13px] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UseCases() {
  const ref = useRef<HTMLElement>(null);
  useScrollRevealAll(ref);
  const cases = [
    { icon: Building2, title: "Retailers", desc: "Manage application work across your customer base. Assign licensed applicators, track completion, and invoice seamlessly." },
    { icon: Wheat, title: "Co-ops", desc: "Coordinate harvest operations across member farms. Match combines, carts, and trucks to fields based on readiness." },
    { icon: Factory, title: "Ethanol plants", desc: "Manage inbound grain logistics. Coordinate trucking, track loads, and maintain delivery schedules at scale." },
    { icon: Warehouse, title: "Grain handlers", desc: "Optimize trucking routes, reduce turnaround times, and coordinate receiving across multiple facilities." },
  ];
  return (
    <section ref={ref} className="py-16 md:py-24">
      <div className="container">
        <h2 className="reveal text-2xl md:text-3xl font-bold tracking-tight text-center mb-10">
          Built for every ag network
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {cases.map((c, i) => (
            <div key={c.title} className="reveal rounded-lg border p-5" style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="flex items-center gap-3 mb-2">
                <c.icon size={18} className="text-primary shrink-0" />
                <h3 className="font-semibold text-sm">{c.title}</h3>
              </div>
              <p className="text-muted-foreground text-[13px] leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HaulingFocus() {
  const ref = useRef<HTMLElement>(null);
  useScrollRevealAll(ref);
  return (
    <section ref={ref} className="py-16 md:py-24 bg-surface-2">
      <div className="container max-w-3xl">
        <div className="text-center">
          <Truck size={28} className="reveal text-primary mx-auto mb-4" />
          <h2 className="reveal text-2xl md:text-3xl font-bold tracking-tight" style={{ transitionDelay: "60ms" }}>
            Fix harvest bottlenecks
          </h2>
          <p className="reveal mt-3 text-muted-foreground text-[14px] max-w-md mx-auto leading-relaxed" style={{ transitionDelay: "120ms" }}>
            Coordinate trucks in real time. Fill gaps instantly. Keep combines running. Manage hauling inside your network or open demand to the marketplace.
          </p>
        </div>
        <div className="reveal grid sm:grid-cols-3 gap-4 mt-8" style={{ transitionDelay: "180ms" }}>
          {[
            { metric: "Reduce idle time", detail: "Match trucks to fields before combines stop" },
            { metric: "Route efficiency", detail: "Cycle-time tracking and load optimization" },
            { metric: "Instant staffing", detail: "Open unfilled hauling jobs to public marketplace" },
          ].map((item) => (
            <div key={item.metric} className="rounded-lg bg-card border p-4 text-center">
              <p className="font-semibold text-sm text-primary">{item.metric}</p>
              <p className="text-muted-foreground text-[12px] mt-1">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ControlSection() {
  const ref = useRef<HTMLElement>(null);
  useScrollRevealAll(ref);
  const points = [
    "Control who participates in your network",
    "Verify operator credentials before they work",
    "Keep pricing and job data private",
    "Maintain and protect existing relationships",
    "Enforce network-wide quality standards",
    "Full audit trail on every action",
  ];
  return (
    <section ref={ref} className="py-16 md:py-24">
      <div className="container max-w-2xl text-center">
        <Shield size={28} className="reveal text-primary mx-auto mb-4" />
        <h2 className="reveal text-2xl md:text-3xl font-bold tracking-tight" style={{ transitionDelay: "60ms" }}>
          Your network. Your rules.
        </h2>
        <ul className="reveal mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-left" style={{ transitionDelay: "120ms" }}>
          {points.map((p) => (
            <li key={p} className="flex items-start gap-2 text-[13px] text-muted-foreground">
              <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function PricingEnterprise() {
  const ref = useRef<HTMLElement>(null);
  useScrollRevealAll(ref);
  const tiers = [
    { name: "Starter", price: "$149", period: "/mo", features: ["Up to 25 members", "Private job routing", "Basic analytics", "Email support"], cta: "Start Free Trial" },
    { name: "Pro", price: "$399", period: "/mo", features: ["Up to 100 members", "Hauling coordination", "Advanced analytics", "Priority support", "Custom rules"], cta: "Start Free Trial", highlight: true },
    { name: "Enterprise", price: "Custom", period: "", features: ["Unlimited members", "Dedicated support", "API access", "Custom integrations", "SLA guarantee", "White-label options"], cta: "Contact Sales" },
  ];
  return (
    <section ref={ref} className="py-16 md:py-24 bg-surface-2">
      <div className="container">
        <h2 className="reveal text-2xl md:text-3xl font-bold tracking-tight text-center mb-10">
          Simple pricing for every network size
        </h2>
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {tiers.map((t, i) => (
            <div
              key={t.name}
              className={`reveal rounded-lg border p-6 ${t.highlight ? "border-primary bg-card shadow-card" : "bg-card"}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <h3 className="font-bold text-base">{t.name}</h3>
              <div className="mt-2 flex items-baseline gap-0.5">
                <span className="text-2xl font-bold tracking-tight">{t.price}</span>
                {t.period && <span className="text-muted-foreground text-sm">{t.period}</span>}
              </div>
              <ul className="mt-4 space-y-2">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[13px] text-muted-foreground">
                    <CheckCircle2 size={13} className="text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full mt-5"
                variant={t.highlight ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link to="/signup">{t.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  const ref = useRef<HTMLElement>(null);
  useScrollRevealAll(ref);
  return (
    <section ref={ref} className="py-16 md:py-20 bg-primary">
      <div className="container text-center">
        <h2 className="reveal text-xl md:text-2xl font-bold tracking-tight text-primary-foreground">
          Ready to run your ag network?
        </h2>
        <p className="reveal mt-2.5 text-primary-foreground/60 text-[14px] max-w-md mx-auto" style={{ transitionDelay: "80ms" }}>
          Join retailers, co-ops, and grain handlers already coordinating their operations through ProlificHire.
        </p>
        <div className="reveal mt-5 flex justify-center gap-2.5" style={{ transitionDelay: "160ms" }}>
          <Button variant="hero" size="default" asChild>
            <Link to="/signup">
              Start Your Network
              <ArrowRight size={14} className="ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function Enterprise() {
  useEffect(() => {
    document.title = "Enterprise Ag Networks — ProlificHire";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Run your agricultural network on ProlificHire. Coordinate growers, operators, and logistics for retailers, co-ops, ethanol plants, and grain handlers."
      );
    }
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroEnterprise />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksEnterprise />
      <FeaturesGrid />
      <UseCases />
      <HaulingFocus />
      <ControlSection />
      <PricingEnterprise />
      <FinalCTA />
      <Footer />
    </div>
  );
}
