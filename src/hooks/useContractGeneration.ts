import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  formatCurrency, formatAcres, formatOperationType,
  formatPricingModel, formatDate,
} from "@/lib/format";

interface GenerateContractParams {
  jobId: string;
  job: any;
  operatorId: string;
}

function buildContractHtml(job: any): string {
  const jf = job.job_fields?.[0];
  const fieldName = jf?.fields?.name || "—";
  const farmName = job.farms?.name || "—";
  const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return `
<h2>Work Authorization Agreement</h2>
<p><strong>Date:</strong> ${now}</p>
<p><strong>Job ID:</strong> ${job.display_id}</p>

<h3>1. Scope of Work</h3>
<p><strong>Operation:</strong> ${formatOperationType(job.operation_type)}</p>
<p><strong>Field:</strong> ${fieldName} (${farmName})</p>
<p><strong>Total Acreage:</strong> ${formatAcres(Number(job.total_acres))}</p>
<p><strong>Deadline:</strong> ${formatDate(job.deadline)}</p>
${job.description ? `<p><strong>Description:</strong> ${job.description}</p>` : ""}
${job.requirements ? `<p><strong>Requirements:</strong> ${job.requirements}</p>` : ""}

<h3>2. Pricing & Payment</h3>
<p><strong>Rate:</strong> ${formatCurrency(Number(job.base_rate))} ${formatPricingModel(job.pricing_model)}</p>
<p><strong>Estimated Total:</strong> ${formatCurrency(Number(job.estimated_total))}</p>
<p><strong>Pricing Model:</strong> ${formatPricingModel(job.pricing_model)}</p>

<h3>3. Responsibilities</h3>
<p><strong>Grower agrees to:</strong></p>
<ul>
<li>Provide accurate field data including boundaries and access instructions</li>
<li>Ensure field accessibility during scheduled work window</li>
<li>Review and approve completed work in a timely manner</li>
<li>Process payment upon satisfactory completion</li>
</ul>
<p><strong>Operator agrees to:</strong></p>
<ul>
<li>Perform work according to the agreed specifications</li>
<li>Maintain proper licensing, insurance, and certifications as required</li>
<li>Provide proof of work upon completion</li>
<li>Comply with all applicable regulations</li>
</ul>

<h3>4. Liability & Disclaimers</h3>
<p>Each party is independently responsible for maintaining appropriate insurance coverage for their operations. The Operator represents that they hold all licenses, certifications, and insurance required by law for the services described. ProlificHire is a marketplace platform and assumes no liability for work performed, crop outcomes, equipment damage, or personal injury arising from the contracted work.</p>

<h3>5. Cancellation</h3>
<p>Unaccepted jobs may be cancelled freely. After acceptance, cancellation requires a stated reason and may be subject to fees if within 48 hours of the scheduled start.</p>

<h3>6. Dispute Resolution</h3>
<p>Disputes shall first be addressed through the platform's dispute resolution process. If unresolved, parties agree to pursue mediation before litigation.</p>

<h3>7. Agreement</h3>
<p>By signing below, both parties agree to the terms of this Work Authorization.</p>
  `.trim();
}

function buildContractJson(job: any) {
  return {
    operation_type: job.operation_type,
    total_acres: job.total_acres,
    base_rate: job.base_rate,
    pricing_model: job.pricing_model,
    estimated_total: job.estimated_total,
    deadline: job.deadline,
    field_name: job.job_fields?.[0]?.fields?.name || null,
    farm_name: job.farms?.name || null,
    scheduled_start: job.scheduled_start,
    scheduled_end: job.scheduled_end,
  };
}

export function useGenerateContract() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, job, operatorId }: GenerateContractParams) => {
      // Check if a contract already exists for this job
      const { data: existing } = await supabase
        .from("contracts")
        .select("id")
        .eq("job_id", jobId)
        .in("status", ["draft", "pending_signature", "partially_signed", "fully_signed"])
        .limit(1);

      if (existing && existing.length > 0) {
        return existing[0]; // Already has a contract
      }

      const fieldIds = (job.job_fields || []).map((jf: any) => jf.field_id);

      // Create the contract
      const { data: contract, error: contractErr } = await supabase
        .from("contracts")
        .insert({
          job_id: jobId,
          title: `Work Authorization — ${job.display_id}`,
          type: "work_authorization" as any,
          status: "pending_signature" as any,
          created_by: user!.id,
          content_html: buildContractHtml(job),
          content_json: buildContractJson(job),
          fields_included: fieldIds,
          terms: {
            cancellation_policy: "48h_fee",
            payment_terms: "upon_approval",
            dispute_resolution: "platform_mediation",
          },
        })
        .select("id")
        .single();

      if (contractErr) throw contractErr;

      // Create signature records for both parties
      const growerName = "Grower"; // Will be resolved from profile
      const operatorName = "Operator";

      const sigInserts = [
        {
          contract_id: contract.id,
          signer_id: job.requested_by,
          signer_name: growerName,
          signer_role: "grower",
          status: "pending" as any,
        },
        {
          contract_id: contract.id,
          signer_id: operatorId,
          signer_name: operatorName,
          signer_role: "operator",
          status: "pending" as any,
        },
      ];

      const { error: sigErr } = await supabase
        .from("contract_signatures")
        .insert(sigInserts);

      if (sigErr) console.warn("Failed to create signature records:", sigErr);

      return contract;
    },
    onSuccess: (_, { jobId }) => {
      qc.invalidateQueries({ queryKey: ["job", jobId] });
      toast.success("Work authorization generated");
    },
    onError: () => {
      toast.error("Failed to generate contract");
    },
  });
}
