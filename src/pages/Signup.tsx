import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Briefcase, Wrench } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { AppMode } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { canPerformAction } from "@/lib/security";

export default function Signup() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AppMode>("grower");
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      localStorage.setItem("ph_active_mode", selectedRole);
      toast.success("Account created! Setting up your workspace...");
      navigate(selectedRole === "operator" ? "/onboarding/operator" : "/onboarding/grower");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-2 px-4 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">PH</span>
          </div>
          <span className="font-bold text-lg tracking-tight">ProlificHire</span>
        </Link>

        <div className="rounded-xl bg-card shadow-card p-6">
          <h1 className="text-lg font-semibold mb-1">Create your account</h1>
          <p className="text-sm text-muted-foreground mb-5">What are you here to do?</p>

          {/* Role picker — prominent segmented */}
          <div className="rounded-xl border-2 border-border bg-surface-2 p-1.5 mb-6">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedRole("grower")}
                className={cn(
                  "rounded-lg px-4 py-3.5 text-left transition-all active:scale-[0.97]",
                  selectedRole === "grower"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-transparent hover:bg-background"
                )}
              >
                <Briefcase size={18} className="mb-1.5" />
                <p className="text-sm font-bold">Hire Work</p>
                <p className={cn("text-[11px] mt-0.5", selectedRole === "grower" ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  I need work done on my fields
                </p>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("operator")}
                className={cn(
                  "rounded-lg px-4 py-3.5 text-left transition-all active:scale-[0.97]",
                  selectedRole === "operator"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-transparent hover:bg-background"
                )}
              >
                <Wrench size={18} className="mb-1.5" />
                <p className="text-sm font-bold">Do Work</p>
                <p className={cn("text-[11px] mt-0.5", selectedRole === "operator" ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  I perform custom work for hire
                </p>
              </button>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(c) => setAgreedToTerms(c === true)}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
                I agree to the{" "}
                <Link to="/legal/terms" className="text-primary underline" target="_blank">Terms of Service</Link>,{" "}
                <Link to="/legal/privacy" className="text-primary underline" target="_blank">Privacy Policy</Link>, and{" "}
                <Link to="/legal/acceptable-use" className="text-primary underline" target="_blank">Acceptable Use Policy</Link>.
              </label>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !agreedToTerms}>
              {loading && <Loader2 size={16} className="animate-spin mr-2" />}
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-sm text-center text-muted-foreground mt-4">
          Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
