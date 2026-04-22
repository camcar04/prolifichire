import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSubmitProofWithPhotos } from "@/hooks/useProofSubmission";
import { Camera, FileUp, Send, X, CheckCircle2 } from "lucide-react";
import { formatBytes } from "@/lib/format";

interface Props {
  jobId: string;
  defaultAcres?: number;
  isResubmission?: boolean;
  onSubmitted?: () => void;
}

export function ProofSubmissionPanel({ jobId, defaultAcres, isResubmission, onSubmitted }: Props) {
  const submit = useSubmitProofWithPhotos(jobId);
  const [notes, setNotes] = useState("");
  const [actualAcres, setActualAcres] = useState(defaultAcres ? String(defaultAcres) : "");
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().slice(0, 10));
  const [files, setFiles] = useState<File[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logInputRef = useRef<HTMLInputElement>(null);

  const photos = files.filter((f) => f.type.startsWith("image/"));
  const logs = files.filter((f) => !f.type.startsWith("image/"));
  const canSubmit = photos.length >= 1 && completionDate && actualAcres && parseFloat(actualAcres) > 0;

  const handleAdd = (list: FileList | null) => {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  };

  const handleRemove = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    await submit.mutateAsync({
      notes,
      actualAcres: parseFloat(actualAcres),
      completionDate,
      files,
    });
    setNotes("");
    setFiles([]);
    onSubmitted?.();
  };

  return (
    <div className="rounded bg-card border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold flex items-center gap-1.5">
          <CheckCircle2 size={12} /> {isResubmission ? "Resubmit Proof of Work" : "Submit Proof of Work"}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="actualAcres" className="text-[11px]">Actual acres completed *</Label>
          <Input
            id="actualAcres"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            value={actualAcres}
            onChange={(e) => setActualAcres(e.target.value)}
            placeholder="0"
            className="h-8 text-[12px] mt-1"
          />
        </div>
        <div>
          <Label htmlFor="completionDate" className="text-[11px]">Completion date *</Label>
          <Input
            id="completionDate"
            type="date"
            value={completionDate}
            onChange={(e) => setCompletionDate(e.target.value)}
            className="h-8 text-[12px] mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="proofNotes" className="text-[11px]">Completion notes</Label>
        <Textarea
          id="proofNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Conditions, issues encountered, deviations from plan…"
          className="text-[12px] min-h-[60px] resize-none mt-1"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[11px]">Completion photos (≥1 required) *</Label>
        <div className="flex flex-wrap gap-2">
          {photos.map((f, i) => {
            const idx = files.indexOf(f);
            const url = URL.createObjectURL(f);
            return (
              <div key={i} className="relative w-16 h-16 rounded overflow-hidden border bg-muted">
                <img src={url} alt={f.name} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  aria-label="Remove photo"
                >
                  <X size={10} />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="w-16 h-16 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:bg-surface-2"
          >
            <Camera size={16} />
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={(e) => handleAdd(e.target.files)}
          />
        </div>
        {photos.length === 0 && (
          <p className="text-[10px] text-warning">Add at least 1 photo to enable submission.</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[11px]">Optional logs (ISO-XML, GPX)</Label>
          <Button size="sm" variant="ghost" className="h-6 text-[11px] gap-1" onClick={() => logInputRef.current?.click()}>
            <FileUp size={11} /> Add file
          </Button>
          <input
            ref={logInputRef}
            type="file"
            accept=".xml,.gpx"
            multiple
            className="hidden"
            onChange={(e) => handleAdd(e.target.files)}
          />
        </div>
        {logs.length > 0 && (
          <ul className="space-y-1">
            {logs.map((f) => {
              const idx = files.indexOf(f);
              return (
                <li key={idx} className="flex items-center justify-between bg-surface-2 rounded px-2 py-1 text-[11px]">
                  <span className="truncate">{f.name} <span className="text-muted-foreground">· {formatBytes(f.size)}</span></span>
                  <button type="button" onClick={() => handleRemove(idx)} className="text-muted-foreground hover:text-destructive">
                    <X size={11} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Button
        size="sm"
        className="w-full gap-1 text-[12px]"
        onClick={handleSubmit}
        disabled={!canSubmit || submit.isPending}
      >
        <Send size={11} /> {submit.isPending ? "Submitting…" : isResubmission ? "Resubmit Proof" : "Submit Proof"}
      </Button>
    </div>
  );
}