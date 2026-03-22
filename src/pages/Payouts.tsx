import AppShell from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/status-badge";
import { jobs, payouts } from "@/data/mock";
import { formatCurrency, formatDate } from "@/lib/format";
import { DollarSign } from "lucide-react";

// Show all payouts for demo (in production, filter by auth user's operator profile)
const myPayouts = payouts;
const totalGross = myPayouts.reduce((a, p) => a + p.grossAmount, 0);
const totalNet = myPayouts.reduce((a, p) => a + p.netAmount, 0);
const totalFees = myPayouts.reduce((a, p) => a + p.platformFee + p.processingFee, 0);

export default function PayoutsPage() {
  return (
    <AppShell title="Payouts">
      <div className="animate-fade-in">
        {/* Summary */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl bg-card shadow-card p-5 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Gross Earned</p>
            <p className="text-2xl font-bold tabular mt-1">{formatCurrency(totalGross)}</p>
          </div>
          <div className="rounded-xl bg-card shadow-card p-5 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Net Paid</p>
            <p className="text-2xl font-bold tabular mt-1 text-success">{formatCurrency(totalNet)}</p>
          </div>
          <div className="rounded-xl bg-card shadow-card p-5 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Fees</p>
            <p className="text-2xl font-bold tabular mt-1 text-muted-foreground">{formatCurrency(totalFees)}</p>
          </div>
        </div>

        {/* Payout list */}
        <div className="rounded-xl bg-card shadow-card">
          <div className="p-4 border-b"><h3 className="font-semibold">Payout History</h3></div>
          {myPayouts.length > 0 ? (
            <div className="divide-y">
              {myPayouts.map(p => {
                const job = jobs.find(j => j.id === p.jobId);
                return (
                  <div key={p.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium">{job?.displayId || "—"} · {job?.fields[0]?.fieldName || "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(p.createdAt)}
                        {p.estimatedArrival && ` · Est. arrival ${formatDate(p.estimatedArrival)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold tabular">{formatCurrency(p.netAmount)}</p>
                        <p className="text-[10px] text-muted-foreground tabular">{formatCurrency(p.platformFee + p.processingFee)} fees</p>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <DollarSign size={24} className="mx-auto mb-2 text-muted-foreground/30" />
              No payouts yet.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
