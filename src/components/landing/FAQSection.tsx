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
    a: "Spraying rates vary by region, product type, and timing. Typical custom application rates range from $8–$18 per acre for ground spraying, depending on distance, product complexity, and equipment requirements. ProlificHire shows estimated market ranges when you create a job so you can price competitively.",
  },
  {
    q: "How do I find harvest crews near me?",
    a: "Post a harvest job on the marketplace with your field details, crop type, expected moisture, and timing window. Operators who offer harvest services within your area will be notified and can quote or accept. You can also browse operator profiles filtered by service type and location.",
  },
  {
    q: "What data do I need to provide for a job?",
    a: "At minimum, you need field boundaries (shapefile, GeoJSON, or drawn on the map), crop type, acreage, and the operation type. For precision work like variable-rate spraying or planting, you'll want to upload prescription maps. ProlificHire automatically bundles all necessary data into a field packet for the operator.",
  },
  {
    q: "How does payment work?",
    a: "After work is completed and approved, ProlificHire generates an invoice based on the agreed pricing. Payments are processed through our secure payment system with support for split payments between owners and tenants. Operators receive payouts directly to their connected bank account.",
  },
  {
    q: "Can I split payments between an owner and a tenant?",
    a: "Yes. ProlificHire supports configurable split payment rules. For example, you can set a 50/50 split between the landowner and tenant farmer. Each party receives a separate invoice for their portion and can pay independently.",
  },
  {
    q: "What file formats are supported for field boundaries?",
    a: "ProlificHire accepts shapefiles (.zip), GeoJSON, KML, and CSV formats for field boundaries. You can also draw boundaries directly on the map. All files are converted to a standard GeoJSON format with automatic acreage calculation.",
  },
  {
    q: "Is my field data secure?",
    a: "Yes. All field data is stored securely with role-based access controls. Only authorized users can view field boundaries, datasets, and financial records. Every file download and access event is logged in an immutable audit trail.",
  },
];

export default function FAQSection() {
  const ref = useRef<HTMLElement>(null);
  useScrollRevealAll(ref);

  return (
    <section ref={ref} id="faq" className="py-20 md:py-28 bg-surface-2">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <p className="reveal text-sm font-semibold text-accent uppercase tracking-wider mb-3">FAQ</p>
          <h2 className="reveal text-3xl md:text-4xl font-bold tracking-tight" style={{ transitionDelay: "80ms" }}>
            Frequently asked questions
          </h2>
        </div>

        <div className="reveal max-w-3xl mx-auto" style={{ transitionDelay: "160ms" }}>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="rounded-xl bg-card shadow-card border-none px-6">
                <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* JSON-LD FAQ structured data */}
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
