import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { AlertPreferences } from "@/components/notifications/AlertPreferences";
import { NotificationPreferences } from "@/components/settings/NotificationPreferences";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bell, CheckCheck, Briefcase, DollarSign, FileText, AlertTriangle, Package, MessageSquare, Shield, Check, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; label: string }> = {
  job_match: { icon: Briefcase, color: "text-primary", label: "Job Match" },
  job_update: { icon: Briefcase, color: "text-chart-2", label: "Job Update" },
  quote: { icon: DollarSign, color: "text-success", label: "Quote" },
  payment: { icon: DollarSign, color: "text-success", label: "Payment" },
  invoice: { icon: FileText, color: "text-chart-4", label: "Invoice" },
  packet: { icon: Package, color: "text-chart-3", label: "Packet" },
  alert: { icon: AlertTriangle, color: "text-warning", label: "Alert" },
  message: { icon: MessageSquare, color: "text-chart-1", label: "Message" },
  contract: { icon: Shield, color: "text-chart-5", label: "Contract" },
  completion: { icon: Check, color: "text-success", label: "Completion" },
};

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, isLoading, unreadCount, markRead, markAllRead } = useNotifications();
  const { activeMode } = useAuth();
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? notifications : notifications.filter((n) => n.type === filter);

  const handleClick = (n: Notification) => {
    if (!n.read) markRead.mutate(n.id);
    if (n.action_url) navigate(n.action_url);
  };

  return (
    <AppShell
      title="Notifications"
      actions={
        unreadCount > 0 ? (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => markAllRead.mutate()}>
            <CheckCheck size={14} /> Mark all read
          </Button>
        ) : undefined
      }
    >
      <Tabs defaultValue="inbox" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inbox" className="gap-1.5">
            <Bell size={14} /> Inbox
            {unreadCount > 0 && (
              <span className="ml-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          {activeMode === "operator" && (
            <TabsTrigger value="alerts" className="gap-1.5">
              <AlertTriangle size={14} /> Alert Rules
            </TabsTrigger>
          )}
          <TabsTrigger value="preferences" className="gap-1.5">
            <Settings size={14} /> Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox">
          {/* Filter row */}
          <div className="flex items-center gap-1.5 mb-4 flex-wrap">
            {[{ key: "all", label: "All" }, ...Object.entries(TYPE_CONFIG).map(([k, v]) => ({ key: k, label: v.label }))].map(
              (f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full transition-colors",
                    filter === f.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {f.label}
                </button>
              )
            )}
          </div>

          <div className="rounded-xl bg-card shadow-card divide-y">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <Bell size={28} className="mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm font-medium">No notifications</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You'll be notified when important events happen.
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
                      "w-full text-left px-5 py-4 hover:bg-surface-2 transition-colors flex gap-4",
                      !n.read && "bg-primary/3"
                    )}
                  >
                    <div className={cn("mt-0.5 shrink-0", cfg.color)}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm leading-snug", !n.read && "font-semibold")}>{n.title}</p>
                        {!n.read && <div className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 mt-1" />}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </TabsContent>

        {activeMode === "operator" && (
          <TabsContent value="alerts">
            <div className="rounded-xl bg-card shadow-card p-6 max-w-2xl">
              <AlertPreferences />
            </div>
          </TabsContent>
        )}

        <TabsContent value="preferences">
          <div className="rounded-xl bg-card shadow-card p-6 max-w-2xl">
            <NotificationPreferences />
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
