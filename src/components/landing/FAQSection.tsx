import { useRef } from "react";
import { useScrollRevealAll } from "@/hooks/useScrollReveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How do I hire a custom farmer?",
    a: "Create an account, add your field boundaries (upload a shapefile or draw on the map), and post a job with the operation type, timing, and requirements. Operators in your area will see the job and can submit quotes or accept at your posted rate.",
  },
  {
    q: "How much does spraying cost per acre?",
    a: "Rates vary by region, product, and timing. Ground application typically runs $8–$18/acre depending on distance and complexity. ProlificHire shows estimated market ranges when you create a job.",
  },
  {
    q: "How do I find harvest crews near me?",
    a: "Post a harvest job with your field details, crop type, moisture expectations, and timing window. Operators who offer harvest services in your area will be notified and can quote or accept.",
  },
  {
    q: "What data do I need to provide?",
    a: "At minimum: field boundaries, crop type, acreage, and operation type. For variable-rate work, upload prescription maps. ProlificHire bundles everything into a field packet for the operator.",
  },
  {
    q: "How does payment work?",
    a: "After work is completed and approved, an invoice is generated from the agreed pricing. Payments process securely with support for owner/tenant splits. Operators receive payouts to their connected bank account.",
  },
  {
    q: "Can I split payments between owner and tenant?",
    a: "Yes. Configure split rules — for example, 50/50 between landowner and tenant. Each party receives a separate invoice and can pay independently.",
  },
  {
    q: "What file formats are supported?",
    a: "Shapefiles (.zip), GeoJSON, KML, and CSV for boundaries. You can also draw directly on the map. All files convert to standard GeoJSON with automatic acreage calculation.",
  },
  {
    q: "Is my field data secure?",
    a: "All data is stored with role-based access controls. Only authorized users can view boundaries, datasets, and financials. Every download is logged in an immutable audit trail.",
  },
];

export default function FAQSection() {
  const ref = useRef<HTMLElement>(null);
  useScrollRevealAll(ref);

  return (
    <section ref={ref} id="faq" className="py-16 md:py-22 bg-surface-2">
      <div className="container">
        <div className="max-w-lg mx-auto text-center mb-12">
          <h2 className="reveal text-2xl md:text-3xl font-bold tracking-tight">
            Frequently asked questions
          </h2>
        </div>

        <div className="reveal max-w-2xl mx-auto" style={{ transitionDelay: "120ms" }}>
          <Accordion type="single" collapsible className="space-y-1.5">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="rounded-lg bg-card shadow-card border-none px-5">
                <AccordionTrigger className="text-left text-[13px] font-medium hover:no-underline py-3.5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-[13px] text-muted-foreground leading-relaxed pb-3.5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map(f => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
    </section>
  );
}
