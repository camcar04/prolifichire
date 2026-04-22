import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface ProofPhoto {
  id: string;
  proof_id: string;
  job_id: string;
  uploaded_by: string;
  storage_path: string;
  file_name: string;
  file_size: number;
  mime_type: string | null;
  kind: string;
  created_at: string;
  signedUrl?: string;
}

export function useProofWithPhotos(jobId: string | undefined) {
  return useQuery({
    queryKey: ["proof-with-photos", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data: proofs, error } = await supabase
        .from("proof_of_work")
        .select("*")
        .eq("job_id", jobId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!proofs || proofs.length === 0) return [];

      const proofIds = proofs.map((p: any) => p.id);
      const { data: photos } = await supabase
        .from("proof_photos")
        .select("*")
        .in("proof_id", proofIds)
        .order("created_at", { ascending: true });

      // Generate signed URLs for photos (1 hour)
      const enriched = await Promise.all(
        (photos || []).map(async (p: any) => {
          const { data: signed } = await supabase.storage
            .from("proof-photos")
            .createSignedUrl(p.storage_path, 3600);
          return { ...p, signedUrl: signed?.signedUrl };
        })
      );

      return proofs.map((p: any) => ({
        ...p,
        photos: enriched.filter((ph) => ph.proof_id === p.id),
      }));
    },
  });
}

export function useMarkInProgress(jobId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("jobs")
        .update({ status: "in_progress", actual_start: new Date().toISOString() })
        .eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job", jobId] });
      toast({ title: "Job started", description: "Status set to In Progress." });
    },
    onError: (e: any) => toast({ title: "Failed to start job", description: e.message, variant: "destructive" }),
  });
}

export interface ProofSubmissionInput {
  notes: string;
  actualAcres: number;
  completionDate: string; // ISO date
  files: File[]; // photos + optional logs
}

export function useSubmitProofWithPhotos(jobId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: ProofSubmissionInput) => {
      const photos = input.files.filter((f) => f.type.startsWith("image/"));
      if (photos.length < 1) {
        throw new Error("At least one completion photo is required");
      }

      // Determine next version
      const { data: existing } = await supabase
        .from("proof_of_work")
        .select("version")
        .eq("job_id", jobId)
        .order("version", { ascending: false })
        .limit(1);
      const nextVersion = (existing?.[0]?.version || 0) + 1;

      // Insert proof row
      const { data: proof, error: proofErr } = await supabase
        .from("proof_of_work")
        .insert({
          job_id: jobId,
          submitted_by: user!.id,
          notes: input.notes || null,
          actual_acres: input.actualAcres || null,
          completion_date: input.completionDate || null,
          status: "pending_review",
          version: nextVersion,
        })
        .select()
        .single();
      if (proofErr) throw proofErr;

      // Upload files
      const uploadedRows: any[] = [];
      for (const file of input.files) {
        const ext = file.name.split(".").pop() || "bin";
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${jobId}/${proof.id}/${Date.now()}_${safe}`;
        const { error: upErr } = await supabase.storage
          .from("proof-photos")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;

        const lower = file.name.toLowerCase();
        let kind: string = "photo";
        if (file.type.startsWith("image/")) kind = "photo";
        else if (lower.endsWith(".xml")) kind = "iso_xml";
        else if (lower.endsWith(".gpx")) kind = "gpx";
        else kind = "other";

        uploadedRows.push({
          proof_id: proof.id,
          job_id: jobId,
          uploaded_by: user!.id,
          storage_path: path,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type || null,
          kind,
        });
      }

      if (uploadedRows.length > 0) {
        const { error: pErr } = await supabase.from("proof_photos").insert(uploadedRows);
        if (pErr) throw pErr;
      }

      // Mark job
      await supabase
        .from("jobs")
        .update({ proof_submitted: true, status: "completed", actual_end: new Date().toISOString() })
        .eq("id", jobId);

      return proof;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proof-with-photos", jobId] });
      qc.invalidateQueries({ queryKey: ["proof-of-work", jobId] });
      qc.invalidateQueries({ queryKey: ["job", jobId] });
      toast({ title: "Proof submitted", description: "The grower has been notified for review." });
    },
    onError: (e: any) => toast({ title: "Submission failed", description: e.message, variant: "destructive" }),
  });
}

export function useReviewProof(jobId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      proofId,
      decision,
      reviewNotes,
    }: {
      proofId: string;
      decision: "approved" | "revision_requested";
      reviewNotes?: string;
    }) => {
      const { error } = await supabase
        .from("proof_of_work")
        .update({
          status: decision,
          review_notes: reviewNotes || null,
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", proofId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["proof-with-photos", jobId] });
      qc.invalidateQueries({ queryKey: ["job", jobId] });
      toast({
        title: vars.decision === "approved" ? "Work approved" : "Revision requested",
        description:
          vars.decision === "approved"
            ? "Job moved to approved status."
            : "Operator has been asked to resubmit.",
      });
    },
    onError: (e: any) => toast({ title: "Review failed", description: e.message, variant: "destructive" }),
  });
}