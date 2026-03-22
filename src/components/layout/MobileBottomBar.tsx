import { Link, useLocation } from "react-router-dom";
import { useAuth, type AppMode } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Plus, Briefcase, MessageSquare, Search,
  Calendar, Package,
} from "lucide-react";

interface BottomItem {
  icon: typeof LayoutDashboard;
  label: string;
  to: string;
}

const growerItems: BottomItem[] = [
  { icon: LayoutDashboard, label: "Home", to: "/dashboard" },
  { icon: Plus, label: "New Job", to: "/jobs?new=1" },
  { icon: MessageSquare, label: "Messages", to: "/messages" },
  { icon: Search, label: "Search", to: "/marketplace" },
];

const operatorItems: BottomItem[] = [
  { icon: LayoutDashboard, label: "Home", to: "/dashboard" },
  { icon: Calendar, label: "Today", to: "/schedule" },
  { icon: Package, label: "Packets", to: "/packets" },
  { icon: MessageSquare, label: "Messages", to: "/messages" },
];

function getItems(mode: AppMode): BottomItem[] {
  return mode === "operator" ? operatorItems : growerItems;
}

export function MobileBottomBar() {
  const isMobile = useIsMobile();
  const { activeMode } = useAuth();
  const location = useLocation();

  if (!isMobile) return null;

  const items = getItems(activeMode);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom">
      <div className="flex items-stretch">
        {items.map((item) => {
          const active = location.pathname === item.to || 
            (item.to !== "/dashboard" && !item.to.includes("?") && location.pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors min-h-[56px]",
                active
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <item.icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
