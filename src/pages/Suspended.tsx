import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ShieldOff } from "lucide-react";

export default function Suspended() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="h-14 w-14 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto">
          <ShieldOff className="h-7 w-7 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Account suspended</h1>
          <p className="text-sm text-muted-foreground">
            Your account has been suspended. Contact{" "}
            <a className="text-primary underline" href="mailto:support@prolifichire.com">
              support@prolifichire.com
            </a>{" "}
            for assistance.
          </p>
        </div>
        <Button variant="outline" onClick={handleSignOut} className="w-full">
          Sign out
        </Button>
      </div>
    </div>
  );
}
