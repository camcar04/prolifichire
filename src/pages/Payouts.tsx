import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/PageSkeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { DollarSign, FileText, Info, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PayoutsPage() {
  const { user, activeMode } = useAuth();
  const isHireWork = activeMode === "grower";
  const title = isHireWork ? "Financials" : "Payouts";

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["my-invoices", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, jobs(display_id, title, job_fields(fields(name)))")
        .or(`issued_to.eq.${user!.id},issued_by.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // ── Stripe Express dashboard link (operators only) ──
  const openTaxDocs = useMutation({
    mutationFn: async () => {
      // stripe-account-status returns the dashboard link for the connected account
      const { data, error } = await supabase.functions.invoke(
        "stripe-account-status",
        { body: {} }
      );
      if (error) throw error;
      const url =
        (data as any)?.dashboard_url ||
        (data as any)?.express_dashboard_url ||
        (data as any)?.login_link ||
        null;
      if (!url) {
        // Fall back to a generic Express dashboard URL — operator will be prompted to log in
        window.open("https://connect.stripe.com/express_login", "_blank", "noopener,noreferrer");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    },
    onError: (e: any) => toast.error(e.message || "Could not open tax dashboard"),
  });

  const totalGross = invoices.reduce((a, i: any) => a + Number(i.total || 0), 0);
  const totalPaid = invoices.filter((i: any) => i.status === "paid").reduce((a, i: any) => a + Number(i.total || 0), 0);
  const totalFees = invoices.reduce((a, i: any) => a + Number(i.fees || 0), 0);

  return (
    <AppShell title={title}>
      <div className="animate-fade-in">
        {!isHireWork && (
          <div className="rounded-lg border border-info/30 bg-info/5 p-4 mb-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                <Info size={16} className="text-info" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold mb-1">Tax reporting</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  ProlificHire uses Stripe for all payments. If you receive
                  $600 or more in a calendar year, Stripe will issue you a
                  1099-K and report your earnings to the IRS. Your Stripe
                  Express dashboard shows your full payment history and tax
                  documents.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 gap-1.5"
                  onClick={() => openTaxDocs.mutate()}
                  disabled={openTaxDocs.isPending}
                >
                  {openTaxDocs.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <FileText size={14} />
                  )}
                  View Tax Documents
                  <ExternalLink size={12} />
                </Button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={<DollarSign size={24} />}
            title={isHireWork ? "No financial records yet" : "No payouts yet"}
            description={isHireWork
              ? "Invoices and payment records appear here after jobs are completed."
              : "Payouts appear here after you complete jobs and invoices are processed."
            }
            action={{ label: "View Jobs", to: "/jobs" }}
          />
        ) : (
          <>
            <div className="grid sm:grid-cols-3 gap-3 mb-5">
              <div className="rounded bg-card border p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Invoiced</p>
                <p className="text-xl font-bold tabular mt-1">{formatCurrency(totalGross)}</p>
              </div>
              <div className="rounded bg-card border p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Paid</p>
                <p className="text-xl font-bold tabular mt-1 text-success">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="rounded bg-card border p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{isHireWork ? "Platform Fees" : "Fees"}</p>
                <p className="text-xl font-bold tabular mt-1 text-muted-foreground">{formatCurrency(totalFees)}</p>
              </div>
            </div>

            <div className="rounded bg-card border">
              <div className="px-4 py-2.5 border-b"><h3 className="text-sm font-semibold">Invoice History</h3></div>
              <div className="divide-y">
                {invoices.map((inv: any) => {
                  const fieldName = inv.jobs?.job_fields?.[0]?.fields?.name;
                  return (
                    <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{inv.display_id}{fieldName ? ` · ${fieldName}` : ""}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(inv.created_at)} · Due {formatDate(inv.due_date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-medium tabular">{formatCurrency(Number(inv.total))}</p>
                          {Number(inv.fees) > 0 && <p className="text-[10px] text-muted-foreground tabular">{formatCurrency(Number(inv.fees))} fees</p>}
                        </div>
                        <StatusBadge status={inv.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
