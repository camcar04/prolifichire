import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Map, Briefcase, Store, Users, DollarSign,
  Shield, Settings, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
  { icon: Map, label: "Fields", to: "/fields" },
  { icon: Briefcase, label: "Jobs", to: "/jobs" },
  { icon: Store, label: "Marketplace", to: "/marketplace" },
  { icon: Users, label: "Operators", to: "/operators" },
  { icon: DollarSign, label: "Finance", to: "/finance" },
  { icon: Shield, label: "Compliance", to: "/compliance" },
  { icon: Settings, label: "Settings", to: "/settings" },
];

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppShell({ children, title }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-surface-2">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-[width] duration-200 z-40",
          collapsed ? "w-16" : "w-56"
        )}
      >
        <div className="h-16 flex items-center gap-2 px-4 border-b border-sidebar-border shrink-0">
          <div className="h-8 w-8 shrink-0 rounded-md bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold text-xs">PH</span>
          </div>
          {!collapsed && (
            <span className="font-bold text-sidebar-foreground tracking-tight text-sm">ProlificHire</span>
          )}
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon size={18} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-12 flex items-center justify-center border-t border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* Main */}
      <div className={cn("flex-1 transition-[margin-left] duration-200", collapsed ? "ml-16" : "ml-56")}>
        <header className="h-16 bg-background border-b flex items-center px-6 sticky top-0 z-30">
          {title && <h1 className="text-lg font-semibold">{title}</h1>}
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
