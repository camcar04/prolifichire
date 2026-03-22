import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t bg-surface-2 py-12">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">PH</span>
              </div>
              <span className="font-bold tracking-tight">ProlificHire</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              The field-centric marketplace and operations platform for agricultural work.
            </p>
          </div>

          <div className="flex gap-16">
            <div>
              <h4 className="font-semibold text-sm mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><Link to="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><Link to="/legal/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/legal/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/legal/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link></li>
                <li><Link to="/legal/acceptable-use" className="hover:text-foreground transition-colors">Acceptable Use</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t text-xs text-muted-foreground">
          © {new Date().getFullYear()} ProlificHire. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
