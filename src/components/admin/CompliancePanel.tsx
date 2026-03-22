import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminCredentialActions } from "@/components/operators/CredentialManager";
import { StatusBadge } from "@/components/ui/status-badge";
import { ShieldCheck, AlertTriangle, Clock, FileText } from "lucide-react";
import { formatDate, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CompliancePanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-credentials"],
    queryFn: async () => {
      const { data: creds } = await supabase
        .from("credentials")
        .select("*, operator_profiles!credentials_operator_id_fkey(business_name, user_id)")
        .order("created_at", { ascending: false })
        .limit(50);
      return creds || [];
    },
  });

  if (isLoading) return <div className="h-40 bg-muted animate-pulse rounded-lg" />;

  const credentials = data || [];
  const now = new Date();
  const pending = credentials.filter((c: any) => c.status === "pending_verification");
  const expiringSoon = credentials.filter((c: any) => {
    if (!c.expires_at) return false;
    const days = (new Date(c.expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return days > 0 && days < 30;
  });
  const expired = credentials.filter((c: any) => c.expires_at && new Date(c.expires_at) < now);

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg bg-card border p-3 text-center">
          <p className="text-2xl font-bold tabular-nums">{credentials.length}</p>
          <p className="text-[11px] text-muted-foreground">Total Credentials</p>
        </div>
        <div className="rounded-lg bg-card border p-3 text-center">
          <p className="text-2xl font-bold tabular-nums text-warning">{pending.length}</p>
          <p className="text-[11px] text-muted-foreground">Pending Review</p>
        </div>
        <div className="rounded-lg bg-card border p-3 text-center">
          <p className="text-2xl font-bold tabular-nums text-amber-600">{expiringSoon.length}</p>
          <p className="text-[11px] text-muted-foreground">Expiring Soon</p>
        </div>
        <div className="rounded-lg bg-card border p-3 text-center">
          <p className="text-2xl font-bold tabular-nums text-destructive">{expired.length}</p>
          <p className="text-[11px] text-muted-foreground">Expired</p>
        </div>
      </div>

      {/* Pending review */}
      {pending.length > 0 && (
        <div className="rounded-lg bg-card border">
          <div className="px-4 py-2.5 border-b flex items-center gap-2">
            <Clock size={13} className="text-warning" />
            <h3 className="text-[13px] font-semibold">Pending Review ({pending.length})</h3>
          </div>
          <div className="divide-y">
            {pending.map((cred: any) => (
              <div key={cred.id} className="px-4 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{cred.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {cred.operator_profiles?.business_name || "Unknown"} · {cred.type} · {cred.issuer}
                    {cred.number ? ` · #${cred.number}` : ""}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Uploaded {formatRelative(cred.created_at)}</p>
                </div>
                <AdminCredentialActions credentialId={cred.id} currentStatus={cred.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expiring / Expired */}
      {(expiringSoon.length > 0 || expired.length > 0) && (
        <div className="rounded-lg bg-card border">
          <div className="px-4 py-2.5 border-b flex items-center gap-2">
            <AlertTriangle size={13} className="text-destructive" />
            <h3 className="text-[13px] font-semibold">Attention Required ({expiringSoon.length + expired.length})</h3>
          </div>
          <div className="divide-y">
            {[...expired, ...expiringSoon].map((cred: any) => {
              const isExp = cred.expires_at && new Date(cred.expires_at) < now;
              return (
                <div key={cred.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{cred.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cred.operator_profiles?.business_name} · {isExp ? "Expired" : "Expires"} {formatDate(cred.expires_at)}
                    </p>
                  </div>
                  <span className={cn("text-[10px] font-medium", isExp ? "text-destructive" : "text-warning")}>
                    {isExp ? "Expired" : "Expiring"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All credentials */}
      <div className="rounded-lg bg-card border">
        <div className="px-4 py-2.5 border-b flex items-center gap-2">
          <ShieldCheck size={13} />
          <h3 className="text-[13px] font-semibold">All Credentials</h3>
        </div>
        <div className="divide-y max-h-96 overflow-auto">
          {credentials.map((cred: any) => (
            <div key={cred.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
              <div className="min-w-0">
                <p className="font-medium truncate">{cred.name}</p>
                <p className="text-[11px] text-muted-foreground">{cred.operator_profiles?.business_name} · {cred.issuer}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn("text-[10px] font-medium",
                  cred.status === "verified" ? "text-success" :
                  cred.status === "pending_verification" ? "text-warning" :
                  cred.status === "rejected" ? "text-destructive" : "text-muted-foreground"
                )}>
                  {cred.status === "verified" ? "Verified" : cred.status === "pending_verification" ? "Pending" : cred.status}
                </span>
                <AdminCredentialActions credentialId={cred.id} currentStatus={cred.status} />
              </div>
            </div>
          ))}
          {credentials.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">No credentials in the system yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
