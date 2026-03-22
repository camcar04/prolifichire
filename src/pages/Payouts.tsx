import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/PageSkeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { DollarSign } from "lucide-react";

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

  const totalGross = invoices.reduce((a, i: any) => a + Number(i.total || 0), 0);
  const totalPaid = invoices.filter((i: any) => i.status === "paid").reduce((a, i: any) => a + Number(i.total || 0), 0);
  const totalFees = invoices.reduce((a, i: any) => a + Number(i.fees || 0), 0);

  return (
    <AppShell title={title}>
      <div className="animate-fade-in">
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
