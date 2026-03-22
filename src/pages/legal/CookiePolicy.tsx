import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex h-14 items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Back
          </Link>
          <span className="text-sm font-semibold">Cookie Policy</span>
        </div>
      </header>

      <main className="container max-w-3xl py-12 prose prose-neutral dark:prose-invert">
        <h1>Cookie Policy</h1>
        <p className="lead">Last updated: March 22, 2026</p>

        <p>This Cookie Policy explains how ProlificHire, Inc. ("ProlificHire," "we," "us," or "our") uses cookies and similar tracking technologies when you visit or use our platform.</p>

        <h2>1. What Are Cookies?</h2>
        <p>Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and understand how you interact with it.</p>

        <h2>2. Types of Cookies We Use</h2>

        <h3>2.1 Strictly Necessary Cookies</h3>
        <p>These cookies are essential for the Service to function. They enable core features like authentication, session management, and security. You cannot opt out of these cookies.</p>
        <table>
          <thead>
            <tr><th>Cookie</th><th>Purpose</th><th>Duration</th></tr>
          </thead>
          <tbody>
            <tr><td>sb-auth-token</td><td>Authentication session</td><td>Session / 7 days</td></tr>
            <tr><td>sb-refresh-token</td><td>Session refresh</td><td>30 days</td></tr>
            <tr><td>ph-consent</td><td>Cookie consent preference</td><td>1 year</td></tr>
            <tr><td>ph-role-mode</td><td>Active application mode</td><td>1 year</td></tr>
          </tbody>
        </table>

        <h3>2.2 Functional Cookies</h3>
        <p>These cookies remember your preferences and settings to enhance your experience.</p>
        <table>
          <thead>
            <tr><th>Cookie</th><th>Purpose</th><th>Duration</th></tr>
          </thead>
          <tbody>
            <tr><td>ph-map-style</td><td>Preferred map basemap style</td><td>1 year</td></tr>
            <tr><td>ph-offline-queue</td><td>Offline action queue (localStorage)</td><td>Until synced</td></tr>
            <tr><td>ph-notification-prefs</td><td>Notification display preferences</td><td>1 year</td></tr>
          </tbody>
        </table>

        <h3>2.3 Analytics Cookies</h3>
        <p>These cookies help us understand how users interact with the Service so we can improve it. They collect anonymized, aggregated data.</p>
        <table>
          <thead>
            <tr><th>Cookie</th><th>Purpose</th><th>Duration</th></tr>
          </thead>
          <tbody>
            <tr><td>_ga / _gid</td><td>Google Analytics (if enabled)</td><td>2 years / 24 hours</td></tr>
          </tbody>
        </table>

        <h2>3. Managing Cookies</h2>
        <p>When you first visit ProlificHire, you will see a cookie consent banner allowing you to accept or decline non-essential cookies. You can change your preferences at any time in your account settings or by clearing your browser cookies.</p>
        <p>Most browsers also allow you to control cookies through their settings. Note that disabling certain cookies may affect the functionality of the Service.</p>

        <h2>4. Third-Party Cookies</h2>
        <p>We use the following third-party services that may set cookies:</p>
        <ul>
          <li><strong>Stripe:</strong> Payment processing and fraud prevention</li>
          <li><strong>Map tile providers:</strong> Map display and geospatial rendering</li>
        </ul>
        <p>These third parties have their own cookie and privacy policies.</p>

        <h2>5. Updates</h2>
        <p>We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated revision date.</p>

        <h2>6. Contact</h2>
        <p>For questions about our use of cookies, contact us at <a href="mailto:privacy@prolifichire.com">privacy@prolifichire.com</a>.</p>
      </main>
    </div>
  );
}
