export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function formatAcres(acres: number): string {
  return `${acres.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ac`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateShort(date: string): string {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export function formatRelative(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateShort(date);
}

export function formatDistance(miles: number): string {
  return `${miles.toFixed(1)} mi`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function formatOperationType(type: string): string {
  const labels: Record<string, string> = {
    mowing: "Mowing / Hay Cutting",
    baling: "Baling",
    rock_picking: "Rock Picking",
    soil_sampling: "Soil Sampling",
    grain_hauling: "Grain Hauling / Semi Support",
    hauling: "Hauling",
  };
  return labels[type] || type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function formatCropType(type: string): string {
  return type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function formatPricingModel(model: string): string {
  const map: Record<string, string> = {
    per_acre: "Per Acre",
    per_hour: "Per Hour",
    flat_rate: "Flat Rate",
    negotiated: "Negotiated",
  };
  return map[model] || model;
}

export function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || `${singular}s`);
}
