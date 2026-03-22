import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const CONSENT_KEY = "ph-cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = (level: "all" | "essential") => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ level, timestamp: new Date().toISOString() }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 pointer-events-none">
      <div className="mx-auto max-w-2xl pointer-events-auto">
        <div className="rounded-xl border bg-card shadow-xl p-5 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
              <Cookie size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium mb-1">We value your privacy</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We use essential cookies for authentication and core functionality. Optional analytics cookies help us improve the platform.
                Read our{" "}
                <Link to="/legal/cookies" className="underline hover:text-foreground transition-colors">
                  Cookie Policy
                </Link>{" "}
                and{" "}
                <Link to="/legal/privacy" className="underline hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>{" "}
                for details.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Button size="sm" onClick={() => accept("all")} className="h-8 text-xs">
                  Accept All
                </Button>
                <Button size="sm" variant="outline" onClick={() => accept("essential")} className="h-8 text-xs">
                  Essential Only
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
