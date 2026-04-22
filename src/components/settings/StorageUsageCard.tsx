import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { HardDrive, Loader2 } from "lucide-react";

const STORAGE_LIMIT_BYTES = 5_368_709_120; // 5 GB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export function StorageUsageCard() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["storage-usage", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Pull all dataset_assets the user can read (RLS scopes to their farms).
      const { data: rows, error } = await supabase
        .from("dataset_assets")
        .select("file_size");
      if (error) throw error;
      const totalBytes = (rows || []).reduce((sum, r) => sum + (r.file_size || 0), 0);
      return { count: rows?.length || 0, totalBytes };
    },
  });

  const totalBytes = data?.totalBytes || 0;
  const count = data?.count || 0;
  const pct = Math.min(100, (totalBytes / STORAGE_LIMIT_BYTES) * 100);
  const nearLimit = pct > 80;

  return (
    <section className="rounded bg-card border p-4">
      <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <HardDrive size={14} /> Storage
      </h2>
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 size={12} className="animate-spin" /> Calculating usage…
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-muted-foreground">Files uploaded</p>
              <p className="text-base font-semibold">{count.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Storage used</p>
              <p className="text-base font-semibold">{formatBytes(totalBytes)}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Progress value={pct} className="h-2" />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{pct.toFixed(1)}% of 5 GB</span>
              <span>{formatBytes(STORAGE_LIMIT_BYTES - totalBytes)} remaining</span>
            </div>
            {nearLimit && (
              <p className="text-[11px] text-warning">
                You're approaching your storage limit. Consider archiving old files.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}