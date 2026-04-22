import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";
import { canPerformAction } from "@/lib/security";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformAction("forgot-password", 3000)) {
      toast.error("Please wait before trying again.");
      return;
    }
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || trimmed.length > 255) {
      toast.error("Please enter a valid email.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    // Always show success to prevent email enumeration
    setSent(true);
    if (error) {
      console.error("Reset email error:", error.message);
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

        <div className="rounded-xl bg-card shadow-card p-6">
          {sent ? (
            <div className="text-center py-2">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MailCheck size={22} className="text-primary" />
              </div>
              <h1 className="text-lg font-semibold mb-1">Check your email</h1>
              <p className="text-sm text-muted-foreground mb-6">
                We sent a reset link to <span className="font-medium text-foreground">{email.trim().toLowerCase()}</span>. Open it on this device to continue.
              </p>
              <Link to="/login" className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1">
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold mb-1">Forgot password</h1>
              <p className="text-sm text-muted-foreground mb-6">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 size={16} className="animate-spin mr-2" />}
                  Send Reset Link
                </Button>
              </form>
            </>
          )}
        </div>

        {!sent && (
          <p className="text-sm text-center text-muted-foreground mt-4">
            <Link to="/login" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}