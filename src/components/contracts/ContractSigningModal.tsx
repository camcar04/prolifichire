import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pen, ShieldCheck, Loader2, FileText, DollarSign, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAcceptQuoteWithContracts, type AcceptQuoteParams } from "@/hooks/useAcceptQuoteWithContracts";
import { toast } from "sonner";

interface ContractSigningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  job: any;
  quote: any;
}

interface PreparedContracts {
  contractGroupId: string;
  workAuthContractId: string;
  paymentAgreementContractId: string;
  operatorId: string;
  operatorName: string;
  growerName: string;
  expiresAt: string;
  workAuthHtml: string;
  paymentAgreementHtml: string;
}

export function ContractSigningModal({ open, onOpenChange, jobId, job, quote }: ContractSigningModalProps) {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const acceptMutation = useAcceptQuoteWithContracts();

  const [prepared, setPrepared] = useState<PreparedContracts | null>(null);
  const [activeTab, setActiveTab] = useState("work_auth");
  const [typedName, setTypedName] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedLiability, setAgreedLiability] = useState(false);

  const fullName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : "";

  // Step 1: prepare contracts (creates rows in DB so we can show real HTML)
  const prepareMutation = useMutation({
    mutationFn: async () => {
      const result = await acceptMutation.mutateAsync({ jobId, job, quote });
      // Fetch the HTML we just stored
      const { data: contracts } = await supabase
        .from("contracts")
        .select("id, type, content_html")
        .in("id", [result.workAuthContractId, result.paymentAgreementContractId]);
      const wa = contracts?.find((c: any) => c.type === "work_authorization");
      const pa = contracts?.find((c: any) => c.type === "payment_agreement");
      return {
        ...result,
        workAuthHtml: wa?.content_html || "",
        paymentAgreementHtml: pa?.content_html || "",
      } as PreparedContracts;
    },
    onSuccess: (p) => setPrepared(p),
    onError: (e: any) => toast.error(e?.message || "Failed to prepare contracts"),
  });

  // Step 2: sign both contracts atomically
  const signMutation = useMutation({
    mutationFn: async () => {
      if (!prepared || !user) throw new Error("Not ready");
      const ids = [prepared.workAuthContractId, prepared.paymentAgreementContractId];

      // Update both signatures
      const { error: sigErr } = await supabase
        .from("contract_signatures")
        .update({
          status: "signed" as any,
          signed_at: new Date().toISOString(),
          user_agent: navigator.userAgent,
        } as any)
        .in("contract_id", ids)
        .eq("signer_id", user.id);
      if (sigErr) throw sigErr;

      // Update each contract's status (partially_signed since operator hasn't signed yet)
      for (const cid of ids) {
        const { data: sigs } = await supabase
          .from("contract_signatures")
          .select("status")
          .eq("contract_id", cid);
        const allSigned = sigs?.every((s: any) => s.status === "signed");
        await supabase
          .from("contracts")
          .update({
            status: (allSigned ? "fully_signed" : "partially_signed") as any,
            ...(allSigned ? { fully_signed_at: new Date().toISOString() } : {}),
          } as any)
          .eq("id", cid);
      }

      // Notify operator (in-app + best-effort email) for each contract
      for (const cid of ids) {
        try {
          await supabase.functions.invoke("notify-contract-signature", {
            body: {
              contractId: cid,
              recipientId: prepared.operatorId,
              jobId,
              jobDisplayId: job.display_id,
              contractTitle: cid === prepared.workAuthContractId ? "Work Authorization" : "Payment Agreement",
              expiresAt: prepared.expiresAt,
            },
          });
        } catch (e) {
          console.warn("Notification failed (non-blocking):", e);
        }
      }
    },
    onSuccess: () => {
      toast.success("Signed! The operator will be notified to countersign.");
      qc.invalidateQueries({ queryKey: ["job", jobId] });
      qc.invalidateQueries({ queryKey: ["job-quotes", jobId] });
      qc.invalidateQueries({ queryKey: ["quotes-received"] });
      onOpenChange(false);
      setPrepared(null);
      setTypedName("");
      setAgreedTerms(false);
      setAgreedLiability(false);
    },
    onError: (e: any) => toast.error(e?.message || "Failed to sign"),
  });

  const canSign =
    !!prepared &&
    typedName.trim().toLowerCase() === fullName.toLowerCase() &&
    fullName.length > 0 &&
    agreedTerms &&
    agreedLiability;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && (prepareMutation.isPending || signMutation.isPending)) return;
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Pen size={16} /> Review &amp; Sign Contracts
          </DialogTitle>
          <DialogDescription className="text-xs">
            Job {job?.display_id} · Two agreements must be signed: Work Authorization and Payment Agreement.
          </DialogDescription>
        </DialogHeader>

        {!prepared ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
            <FileText size={32} className="text-muted-foreground" />
            <p className="text-sm text-center max-w-sm">
              Accepting this quote will generate a Work Authorization and a Payment Agreement.
              Both you and the operator have <strong>7 days</strong> to sign before the offer expires.
            </p>
            <Button
              onClick={() => prepareMutation.mutate()}
              disabled={prepareMutation.isPending}
              className="gap-1.5"
            >
              {prepareMutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Preparing contracts…
                </>
              ) : (
                <>Generate &amp; Review Contracts</>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 gap-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="self-start">
                <TabsTrigger value="work_auth" className="gap-1 text-xs">
                  <FileText size={12} /> Work Authorization
                </TabsTrigger>
                <TabsTrigger value="payment" className="gap-1 text-xs">
                  <DollarSign size={12} /> Payment Agreement
                </TabsTrigger>
              </TabsList>
              <TabsContent value="work_auth" className="flex-1 min-h-0 mt-2">
                <ScrollArea className="h-[320px] rounded border bg-card p-4">
                  <div
                    className="prose prose-sm max-w-none text-[12px] [&_h2]:text-base [&_h3]:text-sm [&_h3]:mt-3 [&_p]:my-1.5"
                    dangerouslySetInnerHTML={{ __html: prepared.workAuthHtml }}
                  />
                </ScrollArea>
              </TabsContent>
              <TabsContent value="payment" className="flex-1 min-h-0 mt-2">
                <ScrollArea className="h-[320px] rounded border bg-card p-4">
                  <div
                    className="prose prose-sm max-w-none text-[12px] [&_h2]:text-base [&_h3]:text-sm [&_h3]:mt-3 [&_p]:my-1.5 [&_table]:text-[11px]"
                    dangerouslySetInnerHTML={{ __html: prepared.paymentAgreementHtml }}
                  />
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Liability + agreement */}
            <div className="rounded border border-warning/20 bg-warning/5 p-3 space-y-2">
              <p className="text-[11px] font-semibold text-warning flex items-center gap-1.5">
                <ShieldCheck size={12} /> Important Legal Notice
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Signing binds you to <strong>both</strong> the Work Authorization and the Payment Agreement.
                Your IP address, timestamp, and device information will be recorded as part of the signature record under the ESIGN Act.
              </p>
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox checked={agreedTerms} onCheckedChange={(c) => setAgreedTerms(c === true)} className="mt-0.5" />
                <span className="text-[12px] text-muted-foreground">
                  I have read and agree to the terms in both contracts above.
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox checked={agreedLiability} onCheckedChange={(c) => setAgreedLiability(c === true)} className="mt-0.5" />
                <span className="text-[12px] text-muted-foreground">
                  I acknowledge that I am responsible for my own licenses, insurance, and compliance with applicable laws.
                </span>
              </label>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-muted-foreground">
                Type your full name to sign both: <span className="text-foreground font-semibold">{fullName}</span>
              </p>
              <Input
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Type your full name exactly"
                className="h-9 text-sm font-medium"
                autoFocus
              />
            </div>

            <div className="rounded border bg-muted/30 px-3 py-2 flex items-center gap-2">
              <Clock size={12} className="text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground">
                Operator has until <strong>{new Date(prepared.expiresAt).toLocaleDateString()}</strong> to countersign.
                If they don't, the offer expires and you can choose another quote.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-xs"
                onClick={() => onOpenChange(false)}
                disabled={signMutation.isPending}
              >
                Close
              </Button>
              <Button
                size="sm"
                className="flex-1 h-9 text-xs gap-1"
                disabled={!canSign || signMutation.isPending}
                onClick={() => signMutation.mutate()}
              >
                {signMutation.isPending ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Signing both…
                  </>
                ) : (
                  <>
                    <Pen size={12} /> Sign Both Contracts
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
