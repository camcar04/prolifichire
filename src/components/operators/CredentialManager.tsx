import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "sonner";
import { Plus, Upload, FileText, AlertTriangle, Clock, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const CREDENTIAL_TYPES = [
  { value: "insurance", label: "General Liability Insurance" },
  { value: "insurance", label: "Cargo Insurance", nameHint: "Cargo Insurance" },
  { value: "insurance", label: "Equipment Insurance", nameHint: "Equipment Insurance" },
  { value: "license", label: "CDL (Commercial Driver's License)", nameHint: "CDL" },
  { value: "license", label: "Applicator License", nameHint: "Applicator License" },
  { value: "certification", label: "Chemical Certification", nameHint: "Chemical Certification" },
  { value: "registration", label: "Business Registration", nameHint: "Business Registration" },
  { value: "bond", label: "Surety Bond", nameHint: "Surety Bond" },
];

function getStatusColor(status: string) {
  switch (status) {
    case "verified": return "text-success";
    case "pending_verification": return "text-warning";
    case "rejected": return "text-destructive";
    case "expired": return "text-destructive";
    default: return "text-muted-foreground";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "verified": return "Verified";
    case "pending_verification": return "Pending Review";
    case "rejected": return "Rejected";
    case "expired": return "Expired";
    default: return status;
  }
}

interface CredentialManagerProps {
  operatorProfileId: string;
  readOnly?: boolean;
}

export function CredentialManager({ operatorProfileId, readOnly = false }: CredentialManagerProps) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data: credentials = [], isLoading } = useQuery({
    queryKey: ["credentials", operatorProfileId],
    queryFn: async () => {
      const { data } = await supabase
        .from("credentials")
        .select("*")
        .eq("operator_id", operatorProfileId)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!operatorProfileId,
  });

  const addMutation = useMutation({
    mutationFn: async (cred: { type: string; name: string; issuer: string; number?: string; expires_at?: string }) => {
      const { error } = await supabase.from("credentials").insert({
        operator_id: operatorProfileId,
        type: cred.type as any,
        name: cred.name,
        issuer: cred.issuer,
        number: cred.number || null,
        expires_at: cred.expires_at || null,
        status: "pending_verification",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials", operatorProfileId] });
      toast.success("Credential added — pending review");
      setAddOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const days = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days > 0 && days < 30;
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-1.5"><ShieldCheck size={14} /> Credentials & Compliance</h3>
        {!readOnly && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 text-xs"><Plus size={12} className="mr-1" /> Add</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Add Credential</DialogTitle></DialogHeader>
              <AddCredentialForm onSubmit={(c) => addMutation.mutate(c)} saving={addMutation.isPending} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {credentials.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={20} />}
          title="No credentials uploaded"
          description={readOnly ? "This operator hasn't uploaded credentials yet." : "Add your licenses, insurance, and certifications to get verified."}
        />
      ) : (
        <div className="space-y-2">
          {credentials.map((cred: any) => {
            const expired = isExpired(cred.expires_at);
            const expiringSoon = isExpiringSoon(cred.expires_at);
            const effectiveStatus = expired ? "expired" : cred.status;

            return (
              <div key={cred.id} className={cn(
                "rounded border p-3 transition-colors",
                expired ? "border-destructive/30 bg-destructive/5" :
                expiringSoon ? "border-warning/30 bg-warning/5" :
                cred.is_verified ? "border-success/20 bg-success/5" : "bg-card"
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{cred.name}</p>
                      {cred.is_verified && <ShieldCheck size={12} className="text-success shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{cred.issuer}{cred.number ? ` · #${cred.number}` : ""}</p>
                  </div>
                  <span className={cn("text-[10px] font-medium shrink-0", getStatusColor(effectiveStatus))}>
                    {getStatusLabel(effectiveStatus)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                  <span className="capitalize">{cred.type}</span>
                  {cred.expires_at && (
                    <span className={cn("flex items-center gap-0.5", expired ? "text-destructive" : expiringSoon ? "text-warning" : "")}>
                      {(expired || expiringSoon) && <AlertTriangle size={9} />}
                      {expired ? "Expired" : expiringSoon ? "Expiring soon —" : "Expires"} {formatDate(cred.expires_at)}
                    </span>
                  )}
                  {cred.file_path && <span className="flex items-center gap-0.5"><FileText size={9} /> Document attached</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddCredentialForm({ onSubmit, saving }: { onSubmit: (c: any) => void; saving: boolean }) {
  const [type, setType] = useState("insurance");
  const [name, setName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [number, setNumber] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Credential type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="insurance">Insurance</SelectItem>
            <SelectItem value="license">License</SelectItem>
            <SelectItem value="certification">Certification</SelectItem>
            <SelectItem value="registration">Registration</SelectItem>
            <SelectItem value="bond">Bond</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Name / description</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. General Liability Insurance" />
      </div>
      <div className="space-y-1.5">
        <Label>Issuing authority</Label>
        <Input value={issuer} onChange={e => setIssuer(e.target.value)} placeholder="e.g. State of Iowa" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Number (optional)</Label>
          <Input value={number} onChange={e => setNumber(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Expiration date</Label>
          <Input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
        </div>
      </div>
      <Button className="w-full" onClick={() => onSubmit({ type, name, issuer, number, expires_at: expiresAt || undefined })} disabled={saving || !name || !issuer}>
        {saving ? "Adding…" : "Add Credential"}
      </Button>
    </div>
  );
}

// Admin verification actions
export function AdminCredentialActions({ credentialId, currentStatus }: { credentialId: string; currentStatus: string }) {
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async ({ status, isVerified }: { status: string; isVerified: boolean }) => {
      const updates: any = {
        status,
        is_verified: isVerified,
      };
      if (isVerified) {
        updates.verified_at = new Date().toISOString();
      }
      const { error } = await supabase.from("credentials").update(updates).eq("id", credentialId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      queryClient.invalidateQueries({ queryKey: ["admin-credentials"] });
      toast.success("Credential updated");
    },
  });

  return (
    <div className="flex items-center gap-1">
      {currentStatus !== "verified" && (
        <Button size="sm" variant="outline" className="h-6 text-[10px] text-success border-success/30"
          onClick={() => updateStatus.mutate({ status: "verified", isVerified: true })}>
          Verify
        </Button>
      )}
      {currentStatus !== "rejected" && (
        <Button size="sm" variant="outline" className="h-6 text-[10px] text-destructive border-destructive/30"
          onClick={() => updateStatus.mutate({ status: "rejected", isVerified: false })}>
          Reject
        </Button>
      )}
    </div>
  );
}
