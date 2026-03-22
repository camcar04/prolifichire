import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Map, Briefcase, Store, DollarSign,
  ChevronLeft, ChevronRight, Search, Bell, X, FolderOpen,
  MessageSquare, Calendar, Package, LogOut, Truck, Bookmark,
  Link2, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, type AppMode } from "@/contexts/AuthContext";
import { RoleModeSwitcher } from "@/components/layout/RoleModeSwitcher";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { OfflineBanner, SyncStatusIndicator } from "@/components/offline/OfflineBanner";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { getInitials } from "@/lib/format";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  to: string;
}

const growerNav: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
  { icon: Map, label: "Fields", to: "/fields" },
  { icon: Briefcase, label: "Jobs", to: "/jobs" },
  { icon: Bookmark, label: "Templates", to: "/templates" },
  { icon: Store, label: "Marketplace", to: "/marketplace" },
  { icon: DollarSign, label: "Financials", to: "/finance" },
  { icon: FolderOpen, label: "Files", to: "/files" },
  { icon: MessageSquare, label: "Messages", to: "/messages" },
  { icon: Link2, label: "Integrations", to: "/integrations" },
];

const operatorNav: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
  { icon: Briefcase, label: "My Jobs", to: "/jobs" },
  { icon: Bookmark, label: "Templates", to: "/templates" },
  { icon: Calendar, label: "Schedule", to: "/schedule" },
  { icon: Package, label: "Field Packets", to: "/packets" },
  { icon: Store, label: "Marketplace", to: "/marketplace" },
  { icon: DollarSign, label: "Payouts", to: "/payouts" },
  { icon: MessageSquare, label: "Messages", to: "/messages" },
  { icon: Link2, label: "Integrations", to: "/integrations" },
];

function getNavItems(mode: AppMode): NavItem[] {
  return mode === "operator" ? operatorNav : growerNav;
}

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

export default function AppShell({ children, title, actions }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);
  const { unreadCount } = useNotifications();
  const { activeMode, profile, signOut } = useAuth();
  const isMobile = useIsMobile();
  const navItems = getNavItems(activeMode);

  const initials = profile
    ? getInitials(profile.firstName, profile.lastName)
    : "??";

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-surface-2">
      {/* Sidebar — hidden on mobile */}
      {!isMobile && (
      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-[width] duration-200 z-40",
        collapsed ? "w-16" : "w-56"
      )}>
        <Link to="/" className="h-14 flex items-center gap-2 px-4 border-b border-sidebar-border shrink-0">
          <div className="h-7 w-7 shrink-0 rounded-md bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold text-[10px]">PH</span>
          </div>
          {!collapsed && <span className="font-bold text-sidebar-foreground tracking-tight text-sm">ProlificHire</span>}
        </Link>

        {/* Role mode switcher */}
        <div className={cn("px-2 py-2.5 border-b border-sidebar-border", collapsed && "px-1")}>
          <RoleModeSwitcher collapsed={collapsed} />
        </div>

        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.to || (item.to !== "/dashboard" && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={17} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-sidebar-border">
          <button
            onClick={handleSignOut}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 text-[13px] text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 transition-colors",
              collapsed && "justify-center px-0"
            )}
            title="Sign out"
          >
            <LogOut size={15} className="shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="h-10 w-full flex items-center justify-center border-t border-sidebar-border text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={cn("flex-1 transition-[margin-left] duration-200 flex flex-col", collapsed ? "ml-16" : "ml-56")}>
        <OfflineBanner />
        <header className="h-14 bg-background border-b flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {title && <h1 className="text-base font-semibold">{title}</h1>}
          </div>

          <div className="flex items-center gap-3">
            <SyncStatusIndicator />

            {/* Search trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-lg border bg-surface-2 px-3 py-1.5 text-sm text-muted-foreground hover:bg-surface-3 transition-colors"
            >
              <Search size={14} />
              <span className="hidden sm:inline">Search…</span>
              <kbd className="hidden sm:inline text-[10px] font-mono bg-background rounded px-1 py-0.5 border ml-4">⌘K</kbd>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors relative"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>

            {/* User */}
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
              {initials}
            </div>

            {actions}
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          <div className="relative w-full max-w-lg rounded-xl bg-card shadow-elevated border animate-scale-in">
            <div className="flex items-center gap-3 px-4 py-3 border-b">
              <Search size={18} className="text-muted-foreground shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search fields, jobs, files, invoices…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button onClick={() => setSearchOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 text-center text-sm text-muted-foreground">
              {searchQuery.length === 0 ? (
                <div>
                  <p>Type to search across all fields, jobs, files, and invoices</p>
                  <div className="flex justify-center gap-2 mt-3">
                    {["North 80", "JOB-1847", "Spraying", "INV-3021"].map(term => (
                      <button
                        key={term}
                        onClick={() => setSearchQuery(term)}
                        className="text-xs px-2 py-1 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p>Search results for "{searchQuery}" would appear here</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
