import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-[10px]">PH</span>
          </div>
          <span className="font-bold text-[15px] tracking-tight">ProlificHire</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#services" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Services</a>
          <a href="#how-it-works" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
          <a href="#faq" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-[13px] h-8" asChild>
            <Link to="/login">Sign In</Link>
          </Button>
          <Button size="sm" className="text-[13px] h-8" asChild>
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>

        <button
          className="md:hidden p-1.5 hover:bg-secondary rounded-md transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t bg-background animate-fade-in">
          <div className="container py-3 flex flex-col gap-1">
            <a href="#features" className="text-sm py-2 px-2 rounded hover:bg-surface-2" onClick={() => setOpen(false)}>Features</a>
            <a href="#services" className="text-sm py-2 px-2 rounded hover:bg-surface-2" onClick={() => setOpen(false)}>Services</a>
            <a href="#how-it-works" className="text-sm py-2 px-2 rounded hover:bg-surface-2" onClick={() => setOpen(false)}>How It Works</a>
            <a href="#faq" className="text-sm py-2 px-2 rounded hover:bg-surface-2" onClick={() => setOpen(false)}>FAQ</a>
            <hr className="my-2" />
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button size="sm" className="flex-1" asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
