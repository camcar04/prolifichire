import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { canPerformAction } from "@/lib/security";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as any)?.from || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side rate limiting
    if (attempts >= 5) {
      toast.error("Too many attempts. Please wait a minute before trying again.");
      return;
    }

    if (!canPerformAction("login", 2000)) {
      toast.error("Please wait before trying again.");
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || trimmedEmail.length > 255) {
      toast.error("Please enter a valid email.");
      return;
    }
    if (!password || password.length > 128) {
      toast.error("Please enter your password.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });
    setLoading(false);

    if (error) {
      setAttempts(a => a + 1);
      // Generic message to prevent user enumeration
      toast.error("Invalid email or password.");
    } else {
      setAttempts(0);
      navigate(redirectTo);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-2 px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">PH</span>
          </div>
          <span className="font-bold text-lg tracking-tight">ProlificHire</span>
        </Link>

        <p className="text-xs text-muted-foreground text-center mb-6 -mt-4 px-4">
          The agricultural operations platform trusted by growers and custom operators across the Midwest.
        </p>

        <div className="rounded-xl bg-card shadow-card p-6">
          <h1 className="text-lg font-semibold mb-1">Sign in</h1>
          <p className="text-sm text-muted-foreground mb-6">Enter your credentials to continue.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                maxLength={255}
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary font-medium hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  maxLength={128}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading || attempts >= 5}>
              {loading && <Loader2 size={16} className="animate-spin mr-2" />}
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-sm text-center text-muted-foreground mt-4">
          Don't have an account? <Link to="/signup" className="text-primary font-medium hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
