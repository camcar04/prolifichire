import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGenerateContract } from "@/hooks/useContractGeneration";
import { toast } from "sonner";

export function useAcceptJob() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const generateContract = useGenerateContract();

  return useMutation({
    mutationFn: async ({ jobId, job }: { jobId: string; job: any }) => {
      // Derive agreed price from job data
      const agreedPrice = Number(job.approved_total || job.estimated_total || 0);
      const feeRate = 0.05;
      const feeAmount = agreedPrice > 0 ? Math.round(agreedPrice * feeRate * 100) / 100 : 0;

      // Update job status to accepted, assign operator, and set funding_required
      const { error } = await supabase
        .from("jobs")
        .update({
          status: "accepted" as any,
          operator_id: user!.id,
          agreed_price: agreedPrice > 0 ? agreedPrice : null,
          platform_fee_amount: feeAmount > 0 ? feeAmount : null,
          funding_status: agreedPrice > 0 ? "funding_required" : "unfunded",
        } as any)
        .eq("id", jobId);

      if (error) throw error;

      // Auto-generate contract
      try {
        await generateContract.mutateAsync({
          jobId,
          job,
          operatorId: user!.id,
        });
      } catch (e) {
        console.warn("Contract generation failed (non-blocking):", e);
      }

      // Auto-generate field packet if fields exist
      const jobFields = job.job_fields || [];
      for (const jf of jobFields) {
        const { error: packetErr } = await supabase
          .from("field_packets")
          .insert({
            job_id: jobId,
            field_id: jf.field_id,
            operator_id: user!.id,
            status: "pending" as any,
            version: 1,
          });
        if (packetErr) console.warn("Packet creation failed:", packetErr);
      }

      return { jobId };
    },
    onSuccess: (_, { jobId }) => {
      qc.invalidateQueries({ queryKey: ["job", jobId] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["marketplace-jobs"] });
      toast.success("Job accepted! Contract and field packets generated.");
    },
    onError: () => {
      toast.error("Failed to accept job");
    },
  });
}
