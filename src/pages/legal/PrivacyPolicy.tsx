import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex h-14 items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Back
          </Link>
          <span className="text-sm font-semibold">Privacy Policy</span>
        </div>
      </header>

      <main className="container max-w-3xl py-12 prose prose-neutral dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p className="lead">Last updated: March 22, 2026</p>

        <p>ProlificHire, Inc. ("ProlificHire," "we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, website, and related services (collectively, the "Service").</p>

        <h2>1. Information We Collect</h2>
        <h3>1.1 Information You Provide</h3>
        <ul>
          <li><strong>Account Information:</strong> Name, email address, phone number, organization name, physical address, role (grower, operator, farm manager).</li>
          <li><strong>Profile Information:</strong> Business name, service areas, equipment details, certifications, licenses, insurance documentation.</li>
          <li><strong>Financial Information:</strong> Billing addresses, payment method details (processed via Stripe), bank account information for payouts.</li>
          <li><strong>Field & Farm Data:</strong> Field boundaries (shapefiles, GeoJSON, KML), acreage, crop information, soil data, prescription files, planting plans, yield data, and as-applied records.</li>
          <li><strong>Job Data:</strong> Operation specifications, quotes, contracts, proof-of-work submissions, photos, notes.</li>
          <li><strong>Communications:</strong> Messages sent through the platform, support requests, feedback.</li>
        </ul>

        <h3>1.2 Information Collected Automatically</h3>
        <ul>
          <li><strong>Device & Usage Data:</strong> IP address, browser type, operating system, device identifiers, pages visited, features used, timestamps.</li>
          <li><strong>Location Data:</strong> GPS coordinates from field boundary uploads, geocoded addresses, and approximate location from IP address.</li>
          <li><strong>Cookies & Similar Technologies:</strong> We use essential cookies for authentication and session management, and analytics cookies to improve our Service. See our <Link to="/legal/cookies">Cookie Policy</Link> for details.</li>
        </ul>

        <h3>1.3 Information from Third Parties</h3>
        <ul>
          <li>Identity verification services</li>
          <li>Payment processors (Stripe)</li>
          <li>Connected agricultural platforms (e.g., John Deere Operations Center, Climate FieldView) when you authorize such connections</li>
          <li>Publicly available weather data services</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>Provide, maintain, and improve the Service</li>
          <li>Process transactions, including split payments and operator payouts</li>
          <li>Match growers with qualified operators based on location, service type, and equipment</li>
          <li>Generate field packets and operational documents</li>
          <li>Calculate route distances, travel times, and pricing suggestions</li>
          <li>Send notifications about job status, weather alerts, and account activity</li>
          <li>Verify operator credentials, insurance, and compliance status</li>
          <li>Enforce our Terms of Service and prevent fraud</li>
          <li>Comply with legal obligations</li>
          <li>Generate anonymized and aggregated analytics to improve platform intelligence</li>
        </ul>

        <h2>3. How We Share Your Information</h2>
        <p>We do not sell your personal information. We may share information with:</p>
        <ul>
          <li><strong>Other Platform Users:</strong> Job-related information is shared between growers and operators involved in the same job (e.g., field boundaries, contact information, operation specifications).</li>
          <li><strong>Service Providers:</strong> Third parties that help us operate the Service (hosting, payment processing, mapping, weather data, email delivery).</li>
          <li><strong>Connected Platforms:</strong> When you explicitly authorize a connection (e.g., John Deere, Climate FieldView), we share the data types you authorize.</li>
          <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental regulation.</li>
          <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
        </ul>

        <h2>4. Data Retention</h2>
        <p>We retain your information for as long as your account is active or as needed to provide the Service. Agricultural records (field data, job history, financial records) are retained for a minimum of 7 years to support compliance and audit requirements. You may request deletion of your account and personal data, subject to our legal retention obligations.</p>

        <h2>5. Data Security</h2>
        <p>We implement industry-standard security measures including:</p>
        <ul>
          <li>Encryption in transit (TLS 1.2+) and at rest (AES-256)</li>
          <li>Role-based access controls</li>
          <li>Immutable audit logging</li>
          <li>Regular security assessments</li>
          <li>SOC 2 Type II compliance (in progress)</li>
        </ul>

        <h2>6. Your Rights</h2>
        <p>Depending on your jurisdiction, you may have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Correct inaccurate data</li>
          <li>Delete your data (subject to retention requirements)</li>
          <li>Port your data to another service</li>
          <li>Opt out of marketing communications</li>
          <li>Restrict or object to certain processing</li>
        </ul>
        <p>To exercise these rights, contact us at <a href="mailto:privacy@prolifichire.com">privacy@prolifichire.com</a>.</p>

        <h2>7. Children's Privacy</h2>
        <p>The Service is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.</p>

        <h2>8. International Data Transfers</h2>
        <p>Your information may be transferred to and processed in the United States. By using the Service, you consent to this transfer. We ensure appropriate safeguards are in place for international transfers.</p>

        <h2>9. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify you of material changes by email or through the Service. Continued use after changes constitutes acceptance.</p>

        <h2>10. Contact Us</h2>
        <p>If you have questions about this Privacy Policy, contact us at:</p>
        <address className="not-italic">
          ProlificHire, Inc.<br />
          Email: <a href="mailto:privacy@prolifichire.com">privacy@prolifichire.com</a><br />
          Mail: 123 Agriculture Way, Suite 400, Lincoln, NE 68508
        </address>
      </main>
    </div>
  );
}
