import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pen, ShieldCheck, Loader2 } from "lucide-react";

interface ContractSignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  contractTitle: string;
  jobDisplayId: string;
}

export function ContractSignatureDialog({
  open, onOpenChange, contractId, contractTitle, jobDisplayId,
}: ContractSignatureDialogProps) {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [typedName, setTypedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [agreedLiability, setAgreedLiability] = useState(false);

  const fullName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : "";

  const signMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("contract_signatures")
        .update({
          status: "signed" as any,
          signed_at: new Date().toISOString(),
          user_agent: navigator.userAgent,
        })
        .eq("contract_id", contractId)
        .eq("signer_id", user.id);

      if (error) throw error;

      // Check if all signatures are now complete
      const { data: sigs } = await supabase
        .from("contract_signatures")
        .select("status")
        .eq("contract_id", contractId);

      const allSigned = sigs?.every(s => s.status === "signed");
      if (allSigned) {
        await supabase
          .from("contracts")
          .update({
            status: "fully_signed" as any,
            fully_signed_at: new Date().toISOString(),
          })
          .eq("id", contractId);
      } else {
        await supabase
          .from("contracts")
          .update({ status: "partially_signed" as any })
          .eq("id", contractId);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job"] });
      toast.success("Contract signed successfully");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to sign contract");
    },
  });

  const canSign = typedName.toLowerCase() === fullName.toLowerCase() && agreed && agreedLiability && fullName.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Pen size={16} /> Sign Contract
          </DialogTitle>
          <DialogDescription className="text-xs">
            {contractTitle} · {jobDisplayId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Liability acknowledgment */}
          <div className="rounded-lg border border-warning/20 bg-warning/5 p-3 space-y-2">
            <p className="text-[11px] font-semibold text-warning flex items-center gap-1.5">
              <ShieldCheck size={12} /> Important Legal Notice
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              By signing this agreement, you acknowledge that you are independently responsible for maintaining
              all required licenses, insurance, and certifications for your operations. ProlificHire serves as a
              marketplace platform and does not guarantee work quality, verify credentials beyond self-reporting,
              or assume liability for work performed, crop outcomes, equipment damage, or personal injury.
            </p>
          </div>

          {/* Agreement checkboxes */}
          <div className="space-y-3">
            <label className="flex items-start gap-2 cursor-pointer">
              <Checkbox
                checked={agreed}
                onCheckedChange={(c) => setAgreed(c === true)}
                className="mt-0.5"
              />
              <span className="text-[12px] text-muted-foreground">
                I have read and agree to the terms of this Work Authorization.
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <Checkbox
                checked={agreedLiability}
                onCheckedChange={(c) => setAgreedLiability(c === true)}
                className="mt-0.5"
              />
              <span className="text-[12px] text-muted-foreground">
                I acknowledge that I am solely responsible for my own licenses, insurance, and compliance with applicable laws.
              </span>
            </label>
          </div>

          {/* Signature input */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">
              Type your full name to sign: <span className="text-foreground font-semibold">{fullName}</span>
            </p>
            <Input
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Type your full name exactly"
              className="h-9 text-sm font-medium"
              autoFocus
            />
          </div>

          {/* Metadata notice */}
          <p className="text-[9px] text-muted-foreground">
            This signature is legally binding under the ESIGN Act. Your IP address, timestamp, and device
            information will be recorded as part of the signature record.
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-9 text-xs"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1 h-9 text-xs gap-1"
              disabled={!canSign || signMutation.isPending}
              onClick={() => signMutation.mutate()}
            >
              {signMutation.isPending ? (
                <><Loader2 size={12} className="animate-spin" /> Signing…</>
              ) : (
                <><Pen size={12} /> Sign Contract</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
