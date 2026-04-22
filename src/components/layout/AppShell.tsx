import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Map, Briefcase, Store, DollarSign,
  ChevronLeft, ChevronRight, Search, Bell, X,
  MessageSquare, Calendar, Package, LogOut, Bookmark,
  Link2, Settings, Menu, Users, LifeBuoy, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, type AppMode } from "@/contexts/AuthContext";
import { RoleModeSwitcher } from "@/components/layout/RoleModeSwitcher";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { OfflineBanner, SyncStatusIndicator } from "@/components/offline/OfflineBanner";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { getInitials } from "@/lib/format";
import { useIsMobile } from "@/hooks/use-mobile";
import { SupportTicketDialog } from "@/components/support/SupportTicketDialog";

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  to: string;
}

const growerNav: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
  { icon: Map, label: "Fields", to: "/fields" },
  { icon: Briefcase, label: "Jobs", to: "/jobs" },
  { icon: Calendar, label: "Calendar", to: "/calendar" },
  { icon: Store, label: "Marketplace", to: "/marketplace" },
  { icon: DollarSign, label: "Quotes", to: "/quotes" },
  { icon: Users, label: "Labor", to: "/labor" },
  { icon: Bookmark, label: "Templates", to: "/templates" },
  { icon: Bell, label: "Notifications", to: "/messages" },
  { icon: Link2, label: "Integrations", to: "/integrations" },
  { icon: Settings, label: "Settings", to: "/settings" },
];

const operatorNav: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
  { icon: Briefcase, label: "My Jobs", to: "/jobs" },
  { icon: Calendar, label: "Calendar", to: "/calendar" },
  { icon: Package, label: "Field Packets", to: "/packets" },
  { icon: Store, label: "Marketplace", to: "/marketplace" },
  { icon: Users, label: "Labor", to: "/labor" },
  { icon: Bookmark, label: "Bid Queue", to: "/bid-queue" },
  { icon: DollarSign, label: "Payouts", to: "/payouts" },
  { icon: Bell, label: "Notifications", to: "/messages" },
  { icon: Link2, label: "Integrations", to: "/integrations" },
  { icon: Settings, label: "Settings", to: "/settings" },
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
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { activeMode, profile, signOut, roles } = useAuth();
  const isMobile = useIsMobile();
  const navItems = getNavItems(activeMode);
  const isAdmin = roles.includes("admin");

  const initials = profile
    ? getInitials(profile.firstName, profile.lastName)
    : "??";

  // Set page title
  useEffect(() => {
    if (title) {
      document.title = `${title} — ProlificHire`;
    }
  }, [title]);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

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
      {/* Desktop sidebar */}
      {!isMobile && (
        <aside className={cn(
          "fixed top-0 left-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-[width] duration-200 z-40",
          collapsed ? "w-14" : "w-52"
        )}>
          <Link to="/" className="h-12 flex items-center gap-2 px-3 border-b border-sidebar-border shrink-0">
            <div className="h-6 w-6 shrink-0 rounded bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold text-[9px]">PH</span>
            </div>
            {!collapsed && <span className="font-bold text-sidebar-foreground tracking-tight text-[13px]">ProlificHire</span>}
          </Link>

          <div className={cn("px-2 py-2 border-b border-sidebar-border", collapsed && "px-1")}>
            <RoleModeSwitcher collapsed={collapsed} />
          </div>

          <nav className="flex-1 py-1.5 px-1.5 space-y-px overflow-y-auto">
            {navItems.map((item) => {
              const active = location.pathname === item.to || (item.to !== "/dashboard" && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2.5 rounded px-2.5 py-1.5 text-[12px] transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon size={15} className="shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-sidebar-border">
            {isAdmin && (
              <Link
                to="/admin"
                className={cn(
                  "flex items-center gap-2.5 w-full px-2.5 py-2 text-[12px] transition-colors",
                  location.pathname.startsWith("/admin")
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground",
                  collapsed && "justify-center px-0",
                )}
                title="Admin Panel"
              >
                <Shield size={14} className="shrink-0" />
                {!collapsed && <span>Admin</span>}
              </Link>
            )}
            <button
              onClick={() => setSupportOpen(true)}
              className={cn(
                "flex items-center gap-2.5 w-full px-2.5 py-2 text-[12px] text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 transition-colors",
                collapsed && "justify-center px-0",
              )}
              title="Help & Support"
            >
              <LifeBuoy size={14} className="shrink-0" />
              {!collapsed && <span>Help & Support</span>}
            </button>
            <button
              onClick={handleSignOut}
              className={cn(
                "flex items-center gap-2.5 w-full px-2.5 py-2 text-[12px] text-sidebar-foreground/45 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 transition-colors",
                collapsed && "justify-center px-0"
              )}
              title="Sign out"
            >
              <LogOut size={14} className="shrink-0" />
              {!collapsed && <span>Sign out</span>}
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-full flex items-center justify-center border-t border-sidebar-border text-sidebar-foreground/35 hover:text-sidebar-foreground transition-colors"
            >
              {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>
          </div>
        </aside>
      )}

      {/* Mobile nav drawer */}
      {isMobile && mobileNavOpen && (
        <>
          <div className="fixed inset-0 bg-foreground/30 z-40" onClick={() => setMobileNavOpen(false)} />
          <aside className="fixed top-0 left-0 h-screen w-64 bg-sidebar z-50 flex flex-col animate-slide-in-right">
            <div className="h-12 flex items-center justify-between px-3 border-b border-sidebar-border">
              <span className="font-bold text-sidebar-foreground text-[13px]">ProlificHire</span>
              <button onClick={() => setMobileNavOpen(false)} className="text-sidebar-foreground/60"><X size={18} /></button>
            </div>
            <div className="px-2 py-2 border-b border-sidebar-border">
              <RoleModeSwitcher collapsed={false} />
            </div>
            <nav className="flex-1 py-2 px-2 space-y-px overflow-y-auto">
              {navItems.map((item) => {
                const active = location.pathname === item.to || (item.to !== "/dashboard" && location.pathname.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-2.5 rounded px-3 py-2 text-[13px] transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon size={16} className="shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-sidebar-border p-2">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                >
                  <Shield size={14} /> Admin Panel
                </Link>
              )}
              <button
                onClick={() => { setMobileNavOpen(false); setSupportOpen(true); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
              >
                <LifeBuoy size={14} /> Help & Support
              </button>
              <button onClick={handleSignOut} className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors">
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main */}
      <div className={cn("flex-1 transition-[margin-left] duration-200 flex flex-col", !isMobile && (collapsed ? "ml-14" : "ml-52"))}>
        <OfflineBanner />
        <header className="h-12 bg-background border-b flex items-center justify-between px-4 sm:px-5 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button onClick={() => setMobileNavOpen(true)} className="text-muted-foreground hover:text-foreground">
                <Menu size={18} />
              </button>
            )}
            {title && <h1 className="text-[14px] font-semibold truncate">{title}</h1>}
          </div>

          <div className="flex items-center gap-2">
            <SyncStatusIndicator />

            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-1.5 rounded border bg-surface-2 px-2.5 py-1 text-[12px] text-muted-foreground hover:bg-surface-3 transition-colors"
            >
              <Search size={12} />
              <span className="hidden sm:inline">Search…</span>
              <kbd className="hidden md:inline text-[9px] font-mono bg-background rounded px-1 py-0.5 border ml-3">⌘K</kbd>
            </button>

            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="h-7 w-7 rounded flex items-center justify-center hover:bg-secondary transition-colors relative"
              >
                <Bell size={14} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>

            <button
              onClick={() => navigate("/settings?tab=account")}
              className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer"
              title="Account Hub"
            >
              {initials}
            </button>

            {actions}
          </div>
        </header>

        <main className={cn("flex-1 p-3 sm:p-5", isMobile && "pb-20")}>{children}</main>
      </div>

      <MobileBottomBar />
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <SupportTicketDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </div>
  );
}
