"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui";
import { Button } from "@/components/ui/Button";
import {
  LayoutDashboard,
  Users,
  Building2,
  GitBranch,
  BarChart3,
  FileText,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Organizations", href: "/dashboard/organizations", icon: Building2 },
  { label: "Users", href: "/dashboard/users", icon: Users },
  { label: "Projects", href: "/dashboard/projects", icon: GitBranch },
  { label: "Results Framework", href: "/dashboard/logframe", icon: Target },
  { label: "Indicators", href: "/dashboard/indicators", icon: BarChart3 },
  { label: "Reports", href: "/dashboard/reports", icon: FileText },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 z-30 flex h-[calc(100vh-4rem)] flex-col border-r bg-background transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16",
      )}
    >
      <div className="flex items-center justify-end p-2">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8">
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="flex-1 space-y-1 px-2 pb-4">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                !sidebarOpen && "justify-center",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
