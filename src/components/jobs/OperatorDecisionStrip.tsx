import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatCurrency, formatAcres, formatOperationType } from "@/lib/format";
import { JobEquipmentMatch } from "@/components/operators/JobEquipmentMatch";
import { toast } from "sonner";
import {
  Check, Send, Bookmark, BookmarkCheck, MapPin, Clock, Wheat,
  AlertTriangle, DollarSign, Truck, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OperatorDecisionStripProps {
  job: any;
}

export function OperatorDecisionStrip({ job }: OperatorDecisionStripProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [counterQuoteOpen, setCounterQuoteOpen] = useState(false);
  const [quoteRate, setQuoteRate] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const contractMode = job.contract_mode || "fixed_price";
  const isFixed = contractMode === "fixed_price";
  const isBidding = contractMode === "open_bidding";
  const isInvite = contractMode === "invite_only";

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("jobs").update({
        operator_id: user!.id,
        status: "accepted",
      }).eq("id", job.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Job accepted!");
      queryClient.invalidateQueries({ queryKey: ["job", job.id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const submitQuoteMutation = useMutation({
    mutationFn: async () => {
      const rate = parseFloat(quoteRate);
      if (isNaN(rate) || rate <= 0) throw new Error("Enter a valid rate");
      const total = rate * Number(job.total_acres || 1);
      const { error } = await supabase.from("quotes").insert({
        job_id: job.id,
        operator_id: user!.id,
        pricing_model: job.pricing_model,
        base_rate: rate,
        total_quote: total,
        notes: quoteNotes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Quote submitted");
      setQuoteOpen(false);
      setCounterQuoteOpen(false);
      setQuoteRate("");
      setQuoteNotes("");
      queryClient.invalidateQueries({ queryKey: ["job", job.id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSave = () => {
    setSaved(true);
    toast.success("Job saved to your quote folder");
  };

  const stats = [
    { icon: Wheat, label: formatOperationType(job.operation_type), sub: "Type" },
    { icon: MapPin, label: formatAcres(Number(job.total_acres)), sub: "Acres" },
    { icon: DollarSign, label: formatCurrency(Number(job.estimated_total)), sub: isFixed ? "Payout" : "Est. range" },
    { icon: Clock, label: job.urgency !== "normal" ? job.urgency : "Standard", sub: "Urgency" },
  ];

  if (job.travel_distance) {
    stats.push({ icon: Truck, label: `${Number(job.travel_distance).toFixed(0)} mi`, sub: "Distance" });
  }

  const QuoteDialog = ({ open, onOpenChange, title, description }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; description: string }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2 mb-1">{description}</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Acres</span>
            <span className="font-medium tabular">{formatAcres(Number(job.total_acres))}</span>
          </div>
          {isFixed && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Posted rate</span>
              <span className="font-medium tabular">{formatCurrency(Number(job.base_rate))}/ac</span>
            </div>
          )}
          <div>
            <label className="text-xs font-medium mb-1 block">Your rate (per {job.pricing_model === "per_acre" ? "acre" : "unit"})</label>
            <Input type="number" value={quoteRate} onChange={e => setQuoteRate(e.target.value)} placeholder="0.00" className="h-9" />
            {quoteRate && !isNaN(parseFloat(quoteRate)) && (
              <p className="text-xs text-muted-foreground mt-1">
                Total: <span className="font-medium text-foreground">{formatCurrency(parseFloat(quoteRate) * Number(job.total_acres || 1))}</span>
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Notes (optional)</label>
            <Textarea value={quoteNotes} onChange={e => setQuoteNotes(e.target.value)} rows={2} className="text-sm" placeholder="Availability, conditions, equipment details…" />
          </div>
          <Button className="w-full" onClick={() => submitQuoteMutation.mutate()} disabled={submitQuoteMutation.isPending || !quoteRate}>
            {submitQuoteMutation.isPending ? "Submitting…" : "Submit Quote"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="rounded-lg bg-card border">
      {/* At-a-glance strip */}
      <div className="flex flex-wrap gap-3 p-3 border-b bg-surface-2/50">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              <Icon size={12} className="text-muted-foreground shrink-0" />
              <div>
                <p className="font-medium leading-none">{s.label}</p>
                <p className="text-[10px] text-muted-foreground">{s.sub}</p>
              </div>
            </div>
          );
        })}
        {job.urgency !== "normal" && (
          <span className="ml-auto text-[10px] font-bold text-destructive bg-destructive/10 rounded-full px-2 py-0.5 uppercase self-center flex items-center gap-0.5">
            <AlertTriangle size={9} /> {job.urgency}
          </span>
        )}
      </div>

      {/* Contract mode label + actions */}
      <div className="p-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">
            {isFixed ? "Fixed price job — accept at posted rate or submit a different quote" :
             isBidding ? "Open bidding — submit your best quote" :
             "You've been invited to this job"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {isFixed && job.status === "requested" && (
            <>
              <Button size="sm" onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending} className="gap-1">
                <Check size={13} /> Accept at {formatCurrency(Number(job.base_rate))}/ac
              </Button>
              <Button size="sm" variant="outline" onClick={() => setCounterQuoteOpen(true)} className="gap-1">
                <MessageSquare size={13} /> Submit Different Rate
              </Button>
              <QuoteDialog
                open={counterQuoteOpen}
                onOpenChange={setCounterQuoteOpen}
                title="Submit Counter-Quote"
                description={`The posted rate is ${formatCurrency(Number(job.base_rate))}/ac. Submit your preferred rate below.`}
              />
            </>
          )}
          {(isBidding || isInvite) && job.status === "requested" && (
            <>
              <Button size="sm" onClick={() => setQuoteOpen(true)} className="gap-1">
                <Send size={13} /> Submit Quote
              </Button>
              <QuoteDialog
                open={quoteOpen}
                onOpenChange={setQuoteOpen}
                title="Submit Quote"
                description="Enter your rate for this job."
              />
            </>
          )}
          <Button size="sm" variant="outline" onClick={handleSave} disabled={saved} className="gap-1">
            {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
            {saved ? "Saved" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
