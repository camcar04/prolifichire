import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t bg-surface-2 py-10">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-[8px]">PH</span>
              </div>
              <span className="font-bold text-sm tracking-tight">ProlificHire</span>
            </Link>
            <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
              The field-centric marketplace for custom farming services.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-xs mb-2.5 uppercase tracking-wider text-muted-foreground">Services</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li><a href="/#services" className="hover:text-foreground transition-colors">Custom Spraying</a></li>
              <li><a href="/#services" className="hover:text-foreground transition-colors">Custom Planting</a></li>
              <li><a href="/#services" className="hover:text-foreground transition-colors">Custom Harvesting</a></li>
              <li><a href="/#services" className="hover:text-foreground transition-colors">Fertilizer Application</a></li>
              <li><a href="/#services" className="hover:text-foreground transition-colors">Rock Picking</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-xs mb-2.5 uppercase tracking-wider text-muted-foreground">Product</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li><a href="/#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="/#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
              <li><Link to="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link></li>
              <li><a href="/#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-xs mb-2.5 uppercase tracking-wider text-muted-foreground">Legal</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li><Link to="/legal/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/legal/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link to="/legal/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link></li>
              <li><Link to="/legal/acceptable-use" className="hover:text-foreground transition-colors">Acceptable Use</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} ProlificHire. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
