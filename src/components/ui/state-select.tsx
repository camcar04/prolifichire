import { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

const US_STATES = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" }, { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" }, { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" }, { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" }, { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" }, { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" }, { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" }, { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" }, { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" },
];

interface StateSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function StateSelect({ value, onValueChange, className, placeholder = "Select state" }: StateSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return US_STATES;
    const q = search.toLowerCase();
    return US_STATES.filter(s => s.label.toLowerCase().includes(q) || s.value.toLowerCase().includes(q));
  }, [search]);

  const selectedLabel = US_STATES.find(s => s.value === value)?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal h-8 text-sm", !value && "text-muted-foreground", className)}
        >
          {selectedLabel || placeholder}
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <div className="p-2 border-b">
          <Input
            placeholder="Search states…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-7 text-sm"
            autoFocus
          />
        </div>
        <div className="max-h-48 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">No states found</p>
          ) : (
            filtered.map(s => (
              <button
                key={s.value}
                onClick={() => { onValueChange(s.value); setOpen(false); setSearch(""); }}
                className={cn(
                  "flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors text-left",
                  value === s.value && "bg-accent"
                )}
              >
                <Check className={cn("h-3 w-3 shrink-0", value === s.value ? "opacity-100" : "opacity-0")} />
                <span>{s.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">{s.value}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { US_STATES };
