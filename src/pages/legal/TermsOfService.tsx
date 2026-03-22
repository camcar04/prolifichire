import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex h-14 items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Back
          </Link>
          <span className="text-sm font-semibold">Terms of Service</span>
        </div>
      </header>

      <main className="container max-w-3xl py-12 prose prose-neutral dark:prose-invert">
        <h1>Terms of Service</h1>
        <p className="lead">Last updated: March 22, 2026</p>

        <p>These Terms of Service ("Terms") govern your access to and use of the ProlificHire platform, website, and related services (the "Service") provided by ProlificHire, Inc. ("ProlificHire," "we," "us," or "our"). By accessing or using the Service, you agree to be bound by these Terms.</p>

        <h2>1. Eligibility</h2>
        <p>You must be at least 18 years old and capable of entering into legally binding contracts. If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization to these Terms.</p>

        <h2>2. Account Registration</h2>
        <ul>
          <li>You must provide accurate, complete, and current information during registration.</li>
          <li>You are responsible for maintaining the security of your account credentials.</li>
          <li>You must immediately notify us of any unauthorized use of your account.</li>
          <li>One person or entity may not maintain more than one account without prior written consent.</li>
        </ul>

        <h2>3. Platform Role & Marketplace Rules</h2>
        <h3>3.1 Platform Role</h3>
        <p>ProlificHire is a marketplace and operations platform that connects agricultural service providers ("Operators") with landowners, farmers, and farm managers ("Growers"). ProlificHire is not a party to the service agreements between Operators and Growers.</p>

        <h3>3.2 For Growers</h3>
        <ul>
          <li>You are responsible for the accuracy of field data, boundaries, and operation specifications you submit.</li>
          <li>You must provide accurate access instructions and disclose known hazards for your fields.</li>
          <li>You must review and approve quotes, contracts, and proof of work in a timely manner.</li>
          <li>You are responsible for ensuring you have authority to order work on the fields you list.</li>
        </ul>

        <h3>3.3 For Operators</h3>
        <ul>
          <li>You represent that you hold all required licenses, certifications, and insurance for the services you offer.</li>
          <li>You must maintain current credential documentation on the platform.</li>
          <li>You must perform work according to agreed specifications and applicable regulations.</li>
          <li>You must submit accurate proof of work upon completion.</li>
          <li>You are responsible for complying with all applicable pesticide, environmental, and safety regulations.</li>
        </ul>

        <h2>4. Contracts & E-Signatures</h2>
        <p>The Service facilitates electronic signatures on work authorizations and payment agreements. By using the e-signature feature, you agree that:</p>
        <ul>
          <li>Electronic signatures have the same legal effect as handwritten signatures under the ESIGN Act and UETA.</li>
          <li>You consent to conducting transactions electronically.</li>
          <li>Signed documents are stored immutably and constitute binding agreements between the parties.</li>
        </ul>

        <h2>5. Payments, Fees & Settlements</h2>
        <ul>
          <li>Payment processing is handled through Stripe Connect. You agree to Stripe's terms of service.</li>
          <li>ProlificHire charges a platform fee on each completed transaction, disclosed before job acceptance.</li>
          <li>Split payment arrangements are binding upon agreement by all parties.</li>
          <li>Payout timing depends on completion approval and may be subject to dispute holds.</li>
          <li>You are responsible for applicable taxes on income earned or expenses paid through the Service.</li>
        </ul>

        <h2>6. Data & Intellectual Property</h2>
        <h3>6.1 Your Data</h3>
        <p>You retain ownership of all data you upload to the Service, including field boundaries, datasets, photos, and documents. By uploading data, you grant ProlificHire a limited license to process, store, and display that data as necessary to provide the Service.</p>

        <h3>6.2 Shared Data</h3>
        <p>When you share data with other users through jobs, field packets, or messages, you authorize those users to access that data for the purposes of the relevant job or transaction.</p>

        <h3>6.3 Platform Content</h3>
        <p>ProlificHire retains all rights to the platform, its design, code, algorithms, and documentation. You may not copy, modify, or reverse-engineer any part of the Service.</p>

        <h2>7. Disputes Between Users</h2>
        <p>ProlificHire provides a dispute resolution system for disagreements between Growers and Operators. While we facilitate resolution, ProlificHire is not liable for the outcome of disputes. If the built-in dispute process does not resolve the issue, parties may pursue mediation or arbitration as outlined in Section 12.</p>

        <h2>8. Prohibited Conduct</h2>
        <p>You may not:</p>
        <ul>
          <li>Use the Service for any unlawful purpose</li>
          <li>Submit false or misleading information</li>
          <li>Circumvent the platform to avoid fees</li>
          <li>Interfere with the security or integrity of the Service</li>
          <li>Scrape, harvest, or collect data from the Service</li>
          <li>Impersonate another person or entity</li>
          <li>Upload malicious files or code</li>
        </ul>

        <h2>9. Limitation of Liability</h2>
        <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, PROLIFICHIRE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, CROP DAMAGE, EQUIPMENT DAMAGE, OR DATA LOSS, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE FEES PAID BY YOU IN THE 12 MONTHS PRECEDING THE CLAIM.</p>

        <h2>10. Indemnification</h2>
        <p>You agree to indemnify and hold harmless ProlificHire and its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the Service, violation of these Terms, or violation of any law or rights of a third party.</p>

        <h2>11. Disclaimer of Warranties</h2>
        <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We do not guarantee the accuracy of weather data, pricing suggestions, route calculations, or operator recommendations.</p>

        <h2>12. Dispute Resolution & Arbitration</h2>
        <p>Any dispute arising from these Terms or the Service shall be resolved through binding arbitration administered by the American Arbitration Association under its Commercial Arbitration Rules. Arbitration shall take place in Lancaster County, Nebraska. You waive any right to a jury trial or to participate in a class action.</p>

        <h2>13. Termination</h2>
        <p>We may suspend or terminate your access to the Service at any time for violation of these Terms. Upon termination, you may request export of your data within 30 days. Provisions that by their nature should survive termination shall survive.</p>

        <h2>14. Governing Law</h2>
        <p>These Terms are governed by the laws of the State of Nebraska, without regard to conflict of law principles.</p>

        <h2>15. Changes to Terms</h2>
        <p>We may modify these Terms at any time. Material changes will be communicated via email or in-app notification at least 30 days before taking effect. Continued use constitutes acceptance.</p>

        <h2>16. Contact</h2>
        <address className="not-italic">
          ProlificHire, Inc.<br />
          Email: <a href="mailto:legal@prolifichire.com">legal@prolifichire.com</a><br />
          Mail: 123 Agriculture Way, Suite 400, Lincoln, NE 68508
        </address>
      </main>
    </div>
  );
}
