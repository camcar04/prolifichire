import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FileText, Pen, Clock, Check, X, Send, AlertTriangle } from "lucide-react";
import type { Contract, ContractSignature, ContractStatus } from "@/types/domain";
import { formatDateTime } from "@/lib/format";

const statusConfig: Record<ContractStatus, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground", icon: FileText },
  pending_signature: { label: "Pending Signatures", color: "bg-warning/15 text-warning", icon: Clock },
  partially_signed: { label: "Partially Signed", color: "bg-info/15 text-info", icon: Pen },
  fully_signed: { label: "Fully Signed", color: "bg-success/15 text-success", icon: Check },
  expired: { label: "Expired", color: "bg-destructive/15 text-destructive", icon: AlertTriangle },
  voided: { label: "Voided", color: "bg-muted text-muted-foreground", icon: X },
};

function SignatureRow({ sig }: { sig: ContractSignature }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg border bg-card">
      <div className="flex items-center gap-3">
        <div className={cn(
          "h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium",
          sig.status === "signed" ? "bg-success/15 text-success" :
          sig.status === "declined" ? "bg-destructive/15 text-destructive" :
          "bg-muted text-muted-foreground"
        )}>
          {sig.status === "signed" ? <Check size={14} /> :
           sig.status === "declined" ? <X size={14} /> :
           <Clock size={14} />}
        </div>
        <div>
          <p className="text-sm font-medium">{sig.signerName}</p>
          <p className="text-xs text-muted-foreground capitalize">{sig.signerRole}</p>
        </div>
      </div>
      <div className="text-right">
        {sig.status === "signed" ? (
          <p className="text-xs text-success font-medium">Signed {sig.signedAt ? formatDateTime(sig.signedAt) : ""}</p>
        ) : sig.status === "declined" ? (
          <p className="text-xs text-destructive font-medium">Declined</p>
        ) : (
          <p className="text-xs text-muted-foreground">Awaiting signature</p>
        )}
      </div>
    </div>
  );
}

interface ContractPanelProps {
  contracts: Contract[];
  onSign?: (contractId: string) => void;
  onSendReminder?: (contractId: string) => void;
  onCreateContract?: () => void;
  canCreate?: boolean;
  currentUserId?: string;
}

export function ContractPanel({ contracts, onSign, onSendReminder, onCreateContract, canCreate, currentUserId }: ContractPanelProps) {
  if (contracts.length === 0 && !canCreate) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 p-8 text-center">
        <FileText size={28} className="mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">No contracts for this job yet.</p>
        {canCreate && (
          <Button variant="outline" size="sm" className="mt-3" onClick={onCreateContract}>
            Create Contract
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canCreate && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onCreateContract}>
            <FileText size={14} className="mr-1.5" /> New Contract
          </Button>
        </div>
      )}
      {contracts.map(contract => {
        const cfg = statusConfig[contract.status];
        const needsMySignature = contract.signatures.some(
          s => s.signerId === currentUserId && s.status === "pending"
        );
        return (
          <div key={contract.id} className="rounded-xl border bg-card">
            <div className="p-4 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold">{contract.title}</h4>
                    <Badge variant="secondary" className={cn("text-[10px] px-1.5", cfg.color)}>
                      {cfg.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">{contract.type.replace("_", " ")}</p>
                </div>
                <div className="flex gap-1.5">
                  {needsMySignature && onSign && (
                    <Button size="sm" onClick={() => onSign(contract.id)}>
                      <Pen size={14} className="mr-1" /> Sign
                    </Button>
                  )}
                  {contract.status === "pending_signature" && onSendReminder && (
                    <Button variant="ghost" size="sm" onClick={() => onSendReminder(contract.id)}>
                      <Send size={14} className="mr-1" /> Remind
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">Signatures</p>
              {contract.signatures.map(sig => (
                <SignatureRow key={sig.id} sig={sig} />
              ))}
            </div>
            {contract.fullySignedAt && (
              <div className="px-4 pb-3">
                <p className="text-xs text-success flex items-center gap-1">
                  <Check size={12} /> Fully executed on {formatDateTime(contract.fullySignedAt)}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
