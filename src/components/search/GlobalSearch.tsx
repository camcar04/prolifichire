import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, X, Map, Briefcase, FileText, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatOperationType, formatAcres } from "@/lib/format";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  type: "field" | "job" | "file" | "invoice";
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

const typeIcons = {
  field: Map,
  job: Briefcase,
  file: FileText,
  invoice: DollarSign,
};

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim() || !user) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      const q = `%${query}%`;
      const merged: SearchResult[] = [];

      try {
        const [fieldsRes, jobsRes, filesRes] = await Promise.all([
          supabase.from("fields").select("id, name, acreage, crop, farms!inner(name)").ilike("name", q).limit(5),
          supabase.from("jobs").select("id, title, display_id, operation_type, total_acres, status").or(`title.ilike.${q},display_id.ilike.${q}`).limit(5),
          supabase.from("dataset_assets").select("id, file_name, category, field_id").ilike("file_name", q).limit(5),
        ]);

        (fieldsRes.data || []).forEach((f: any) => {
          merged.push({
            type: "field",
            id: f.id,
            title: f.name,
            subtitle: `${(f.farms as any)?.name || ""} · ${formatAcres(Number(f.acreage))}`,
            url: `/fields/${f.id}`,
          });
        });

        (jobsRes.data || []).forEach((j: any) => {
          merged.push({
            type: "job",
            id: j.id,
            title: `${j.display_id} — ${j.title}`,
            subtitle: `${formatOperationType(j.operation_type)} · ${formatAcres(Number(j.total_acres))}`,
            url: `/jobs/${j.id}`,
          });
        });

        (filesRes.data || []).forEach((f: any) => {
          merged.push({
            type: "file",
            id: f.id,
            title: f.file_name,
            subtitle: f.category,
            url: `/fields/${f.field_id}`,
          });
        });
      } catch {
        // fail silently
      }

      setResults(merged);
      setLoading(false);
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, user]);

  if (!open) return null;

  const handleSelect = (url: string) => {
    onOpenChange(false);
    navigate(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative w-full max-w-lg rounded-lg bg-card shadow-elevated border animate-scale-in">
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b">
          <Search size={15} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search fields, jobs, files…"
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
          />
          <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        </div>

        <div className="max-h-72 overflow-auto">
          {query.length === 0 ? (
            <div className="p-5 text-center text-[12px] text-muted-foreground">
              Type to search across fields, jobs, and files
            </div>
          ) : loading ? (
            <div className="p-5 text-center text-[12px] text-muted-foreground">Searching…</div>
          ) : results.length === 0 ? (
            <div className="p-5 text-center text-[12px] text-muted-foreground">
              No results for "{query}"
            </div>
          ) : (
            <div className="divide-y">
              {results.map(r => {
                const Icon = typeIcons[r.type];
                return (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => handleSelect(r.url)}
                    className="flex items-center gap-3 w-full px-3.5 py-2.5 text-left hover:bg-surface-2 transition-colors"
                  >
                    <div className="h-7 w-7 rounded bg-muted flex items-center justify-center shrink-0">
                      <Icon size={13} className="text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium truncate">{r.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{r.subtitle}</p>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground bg-surface-3 rounded px-1.5 py-0.5 shrink-0">{r.type}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
