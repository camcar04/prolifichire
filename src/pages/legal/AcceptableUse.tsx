import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function AcceptableUse() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex h-14 items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Back
          </Link>
          <span className="text-sm font-semibold">Acceptable Use Policy</span>
        </div>
      </header>

      <main className="container max-w-3xl py-12 prose prose-neutral dark:prose-invert">
        <h1>Acceptable Use Policy</h1>
        <p className="lead">Last updated: March 22, 2026</p>

        <p>This Acceptable Use Policy ("AUP") outlines the rules and guidelines for using the ProlificHire platform. Violation of this policy may result in suspension or termination of your account.</p>

        <h2>1. General Conduct</h2>
        <p>You agree to use the Service in a lawful, ethical, and professional manner. You will:</p>
        <ul>
          <li>Provide accurate and truthful information in your profile, listings, and communications</li>
          <li>Treat other users with respect and professionalism</li>
          <li>Respond to job inquiries, quotes, and messages in a timely manner</li>
          <li>Honor accepted quotes and signed contracts</li>
          <li>Report safety hazards, compliance violations, or platform misuse</li>
        </ul>

        <h2>2. Prohibited Activities</h2>
        <ul>
          <li>Posting fraudulent job listings or operator profiles</li>
          <li>Misrepresenting credentials, licenses, insurance, or capabilities</li>
          <li>Circumventing the platform to arrange off-platform transactions and avoid fees</li>
          <li>Uploading malicious files, viruses, or corrupted data</li>
          <li>Attempting to access other users' accounts or data without authorization</li>
          <li>Using automated systems (bots, scrapers) to access the Service</li>
          <li>Harassment, discrimination, or abusive behavior toward other users</li>
          <li>Deliberately submitting false proof of work or inflated acreage</li>
          <li>Manipulating reviews or ratings</li>
        </ul>

        <h2>3. Data & File Uploads</h2>
        <ul>
          <li>You may only upload data you own or have rights to share</li>
          <li>You must not upload data containing personally identifiable information of third parties without consent</li>
          <li>Precision agriculture data shared through the platform must be used only for its intended purpose</li>
          <li>You must not download, copy, or redistribute field data belonging to other users beyond the scope of an active job</li>
        </ul>

        <h2>4. Compliance</h2>
        <p>All users must comply with applicable federal, state, and local laws, including but not limited to:</p>
        <ul>
          <li>EPA regulations regarding pesticide application</li>
          <li>State agricultural licensing requirements</li>
          <li>OSHA safety standards</li>
          <li>Environmental protection regulations</li>
          <li>Data protection and privacy laws</li>
        </ul>

        <h2>5. Enforcement</h2>
        <p>ProlificHire reserves the right to investigate violations and take action including:</p>
        <ul>
          <li>Warning the user</li>
          <li>Temporarily suspending account access</li>
          <li>Permanently terminating the account</li>
          <li>Reporting illegal activity to authorities</li>
          <li>Pursuing legal remedies</li>
        </ul>

        <h2>6. Reporting</h2>
        <p>To report a violation of this policy, contact us at <a href="mailto:compliance@prolifichire.com">compliance@prolifichire.com</a>.</p>
      </main>
    </div>
  );
}
