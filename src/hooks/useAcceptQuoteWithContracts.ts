import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  formatCurrency, formatAcres, formatOperationType, formatPricingModel, formatDate,
} from "@/lib/format";

const PLATFORM_FEE_RATE = 0.075;
const SIGNATURE_WINDOW_DAYS = 7;

function buildWorkAuthHtml(job: any, quote: any, operatorName: string): string {
  const jf = job.job_fields?.[0];
  const fieldName = jf?.fields?.name || "—";
  const farmName = job.farms?.name || "—";
  const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const total = Number(quote.total_quote);

  return `
<h2>Work Authorization Agreement</h2>
<p><strong>Date:</strong> ${now}</p>
<p><strong>Job ID:</strong> ${job.display_id}</p>
<p><strong>Operator:</strong> ${operatorName}</p>

<h3>1. Scope of Work</h3>
<p><strong>Operation:</strong> ${formatOperationType(job.operation_type)}</p>
<p><strong>Field:</strong> ${fieldName} (${farmName})</p>
<p><strong>Total Acreage:</strong> ${formatAcres(Number(job.total_acres))}</p>
<p><strong>Deadline:</strong> ${formatDate(job.deadline)}</p>
${job.description ? `<p><strong>Description:</strong> ${job.description}</p>` : ""}
${job.requirements ? `<p><strong>Requirements:</strong> ${job.requirements}</p>` : ""}

<h3>2. Agreed Rate</h3>
<p><strong>Rate:</strong> ${formatCurrency(Number(quote.base_rate))} ${formatPricingModel(quote.pricing_model)}</p>
<p><strong>Total Quote:</strong> ${formatCurrency(total)}</p>

<h3>3. Responsibilities</h3>
<p><strong>Grower agrees to:</strong></p>
<ul>
<li>Provide accurate field data including boundaries and access instructions</li>
<li>Ensure field accessibility during the scheduled work window</li>
<li>Review and approve completed work in a timely manner</li>
</ul>
<p><strong>Operator agrees to:</strong></p>
<ul>
<li>Perform work according to the agreed specifications</li>
<li>Maintain proper licensing, insurance, and certifications as required</li>
<li>Provide proof of work upon completion</li>
<li>Comply with all applicable regulations</li>
</ul>

<h3>4. Liability</h3>
<p>Each party is independently responsible for maintaining appropriate insurance coverage. ProlificHire is a marketplace platform and assumes no liability for work performed, crop outcomes, equipment damage, or personal injury arising from the contracted work.</p>

<h3>5. Agreement</h3>
<p>By signing below, both parties agree to the scope and terms of this Work Authorization.</p>
  `.trim();
}

function buildPaymentAgreementHtml(job: any, quote: any, operatorName: string): string {
  const total = Number(quote.total_quote);
  const platformFee = Math.round(total * PLATFORM_FEE_RATE * 100) / 100;
  const operatorPayout = Math.round((total - platformFee) * 100) / 100;
  const growerCharge = Math.round((total + platformFee) * 100) / 100;
  const stripeFee = Math.round((growerCharge * 0.029 + 0.30) * 100) / 100;
  const growerTotal = Math.round((growerCharge + stripeFee) * 100) / 100;

  return `
<h2>Payment Agreement</h2>
<p><strong>Job ID:</strong> ${job.display_id}</p>
<p><strong>Operator:</strong> ${operatorName}</p>

<h3>1. Agreed Price</h3>
<p>Both parties agree to the price of <strong>${formatCurrency(total)}</strong> for the work described in the Work Authorization.</p>

<h3>2. Fee Structure (transparent split)</h3>
<table style="width:100%;border-collapse:collapse;margin:8px 0;">
  <tr><td style="padding:4px 8px;">Job total</td><td style="padding:4px 8px;text-align:right;"><strong>${formatCurrency(total)}</strong></td></tr>
  <tr><td style="padding:4px 8px;">Platform fee (7.5% from grower)</td><td style="padding:4px 8px;text-align:right;">+${formatCurrency(platformFee)}</td></tr>
  <tr><td style="padding:4px 8px;">Stripe processing (2.9% + $0.30)</td><td style="padding:4px 8px;text-align:right;">+${formatCurrency(stripeFee)}</td></tr>
  <tr style="border-top:1px solid #ddd;"><td style="padding:4px 8px;"><strong>Grower pays</strong></td><td style="padding:4px 8px;text-align:right;"><strong>${formatCurrency(growerTotal)}</strong></td></tr>
  <tr><td style="padding:4px 8px;">Job total</td><td style="padding:4px 8px;text-align:right;">${formatCurrency(total)}</td></tr>
  <tr><td style="padding:4px 8px;">Platform fee (7.5% from operator)</td><td style="padding:4px 8px;text-align:right;">−${formatCurrency(platformFee)}</td></tr>
  <tr style="border-top:1px solid #ddd;"><td style="padding:4px 8px;"><strong>Operator receives</strong></td><td style="padding:4px 8px;text-align:right;"><strong>${formatCurrency(operatorPayout)}</strong></td></tr>
</table>

<h3>3. Funding & Escrow</h3>
<p>Once both parties sign, the grower will be prompted to fund the agreed amount via Stripe. Funds are held in escrow until the work is approved.</p>

<h3>4. Payout Timing</h3>
<p>The operator's payout is released after the grower approves completed work. Standard Stripe transfer times apply (typically 1–3 business days).</p>

<h3>5. Cancellation Policy</h3>
<p>Before work begins: either party may cancel with no fee. The grower's funded amount is fully refunded.</p>
<p>After work begins: cancellation requires a stated reason. Operator may invoice for work completed. A platform cancellation fee may apply if cancelled within 48 hours of the scheduled start.</p>

<h3>6. Dispute Resolution</h3>
<p>Disputes are first addressed through ProlificHire's dispute resolution process. Funds remain in escrow until disputes are resolved.</p>

<h3>7. Tax Reporting</h3>
<p>Stripe issues 1099-K forms to operators receiving $600 or more per calendar year. ProlificHire does not generate 1099s directly.</p>

<h3>8. Agreement</h3>
<p>By signing below, both parties accept this fee structure and payment terms.</p>
  `.trim();
}

export interface AcceptQuoteParams {
  jobId: string;
  job: any;
  quote: any;
  operatorName?: string;
  growerName?: string;
}

export function useAcceptQuoteWithContracts() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, job, quote, operatorName, growerName }: AcceptQuoteParams) => {
      if (!user) throw new Error("Not authenticated");

      // Resolve names if not passed in
      let opName = operatorName || "Operator";
      let grName = growerName || "Grower";
      if (!operatorName) {
        const { data: opProfile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", quote.operator_id)
          .maybeSingle();
        if (opProfile) {
          opName = `${opProfile.first_name ?? ""} ${opProfile.last_name ?? ""}`.trim() || "Operator";
        }
      }
      if (!growerName) {
        const { data: grProfile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", user.id)
          .maybeSingle();
        if (grProfile) {
          grName = `${grProfile.first_name ?? ""} ${grProfile.last_name ?? ""}`.trim() || "Grower";
        }
      }

      // Group ID links the two contracts
      const groupId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + SIGNATURE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

      // Update job: assign operator, lock in quote terms
      const { error: jobErr } = await supabase
        .from("jobs")
        .update({
          operator_id: quote.operator_id,
          status: "accepted" as any,
          base_rate: quote.base_rate,
          estimated_total: quote.total_quote,
        } as any)
        .eq("id", jobId);
      if (jobErr) throw jobErr;

      // Mark this quote accepted, decline the others, link to group
      await supabase
        .from("quotes")
        .update({
          status: "accepted" as any,
          contract_group_id: groupId,
          contracts_created_at: new Date().toISOString(),
        } as any)
        .eq("id", quote.id);

      const { data: otherQuotes } = await supabase
        .from("quotes")
        .select("id")
        .eq("job_id", jobId)
        .neq("id", quote.id)
        .eq("status", "pending");
      if (otherQuotes && otherQuotes.length > 0) {
        await supabase
          .from("quotes")
          .update({ status: "declined" as any } as any)
          .in("id", otherQuotes.map((q: any) => q.id));
      }

      // Create the two contracts
      const baseContract = {
        job_id: jobId,
        status: "pending_signature" as any,
        created_by: user.id,
        contract_group_id: groupId,
        expires_at: expiresAt,
        fields_included: (job.job_fields || []).map((jf: any) => jf.field_id),
      };

      const { data: workAuth, error: waErr } = await supabase
        .from("contracts")
        .insert({
          ...baseContract,
          title: `Work Authorization — ${job.display_id}`,
          type: "work_authorization" as any,
          content_html: buildWorkAuthHtml(job, quote, opName),
          content_json: {
            operation_type: job.operation_type,
            total_acres: job.total_acres,
            base_rate: quote.base_rate,
            pricing_model: quote.pricing_model,
            total: quote.total_quote,
            deadline: job.deadline,
            field_name: job.job_fields?.[0]?.fields?.name || null,
            farm_name: job.farms?.name || null,
          },
          terms: {
            cancellation_policy: "48h_fee",
            dispute_resolution: "platform_mediation",
          },
        } as any)
        .select("id")
        .single();
      if (waErr) throw waErr;

      const total = Number(quote.total_quote);
      const platformFee = Math.round(total * PLATFORM_FEE_RATE * 100) / 100;

      const { data: payAgr, error: paErr } = await supabase
        .from("contracts")
        .insert({
          ...baseContract,
          title: `Payment Agreement — ${job.display_id}`,
          type: "payment_agreement" as any,
          content_html: buildPaymentAgreementHtml(job, quote, opName),
          content_json: {
            agreed_price: total,
            platform_fee_rate: PLATFORM_FEE_RATE,
            platform_fee_amount: platformFee,
            operator_payout: total - platformFee,
          },
          terms: {
            payment_terms: "escrow_on_approval",
            platform_fee_percent: PLATFORM_FEE_RATE,
            cancellation_policy: "48h_fee",
          },
        } as any)
        .select("id")
        .single();
      if (paErr) throw paErr;

      // Create signature rows for both contracts × both parties
      const sigInserts = [workAuth.id, payAgr.id].flatMap((cid) => [
        {
          contract_id: cid,
          signer_id: user.id,
          signer_name: grName,
          signer_role: "grower",
          status: "pending" as any,
        },
        {
          contract_id: cid,
          signer_id: quote.operator_id,
          signer_name: opName,
          signer_role: "operator",
          status: "pending" as any,
        },
      ]);
      const { error: sigErr } = await supabase.from("contract_signatures").insert(sigInserts);
      if (sigErr) throw sigErr;

      return {
        contractGroupId: groupId,
        workAuthContractId: workAuth.id,
        paymentAgreementContractId: payAgr.id,
        operatorId: quote.operator_id,
        operatorName: opName,
        growerName: grName,
        expiresAt,
      };
    },
    onError: (e: any) => {
      console.error("Accept quote with contracts failed:", e);
      toast.error(e?.message || "Failed to accept quote");
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["job", vars.jobId] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["job-quotes", vars.jobId] });
      qc.invalidateQueries({ queryKey: ["quotes-received"] });
    },
  });
}
