import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { Bell, Check, CheckCheck, Filter, X, Briefcase, DollarSign, FileText, AlertTriangle, Package, MessageSquare, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string }> = {
  job_match: { icon: Briefcase, color: "text-primary" },
  job_update: { icon: Briefcase, color: "text-chart-2" },
  quote: { icon: DollarSign, color: "text-success" },
  payment: { icon: DollarSign, color: "text-success" },
  invoice: { icon: FileText, color: "text-chart-4" },
  packet: { icon: Package, color: "text-chart-3" },
  alert: { icon: AlertTriangle, color: "text-warning" },
  message: { icon: MessageSquare, color: "text-chart-1" },
  contract: { icon: Shield, color: "text-chart-5" },
  completion: { icon: Check, color: "text-success" },
};

const FILTER_TYPES = [
  { key: "all", label: "All" },
  { key: "job_match", label: "Job Matches" },
  { key: "job_update", label: "Job Updates" },
  { key: "quote", label: "Quotes" },
  { key: "payment", label: "Payments" },
  { key: "packet", label: "Packets" },
  { key: "contract", label: "Contracts" },
  { key: "alert", label: "Alerts" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NotificationCenter({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { notifications, isLoading, unreadCount, markRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  if (!open) return null;

  let filtered = filter === "all" ? notifications : notifications.filter((n) => n.type === filter);
  if (showUnreadOnly) filtered = filtered.filter((n) => !n.read);

  const handleClick = (n: Notification) => {
    if (!n.read) markRead.mutate(n.id);
    if (n.action_url) navigate(n.action_url);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-10 w-[400px] max-h-[80vh] rounded-xl bg-card shadow-elevated border z-50 animate-scale-in flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Bell size={16} />
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <span className="h-5 min-w-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => markAllRead.mutate()}
              >
                <CheckCheck size={12} /> Mark all read
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X size={14} />
            </Button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="px-3 py-2 border-b flex items-center gap-1.5 overflow-x-auto shrink-0">
          {FILTER_TYPES.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors",
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={cn(
              "text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ml-auto",
              showUnreadOnly
                ? "bg-chart-2 text-white"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            Unread
          </button>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto divide-y">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <Bell size={24} className="mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {showUnreadOnly ? "No unread notifications" : "No notifications yet"}
              </p>
            </div>
          ) : (
            filtered.map((n) => {
              const cfg = TYPE_CONFIG[n.type] || { icon: Bell, color: "text-muted-foreground" };
              const Icon = cfg.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-surface-2 transition-colors flex gap-3",
                    !n.read && "bg-primary/3"
                  )}
                >
                  <div className={cn("mt-0.5 shrink-0", cfg.color)}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm leading-snug", !n.read && "font-medium")}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
