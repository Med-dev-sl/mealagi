"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Breadcrumbs } from "./Breadcrumbs";
import { useUIStore } from "@/store/ui";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface DashboardShellProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string; icon?: LucideIcon }[];
  children: React.ReactNode;
}

export function DashboardShell({ title, description, action, breadcrumbs, children }: DashboardShellProps) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen">
      <Header />
      <Sidebar />
      <main
        className={cn(
          "pt-16 transition-all duration-300",
          sidebarOpen ? "lg:pl-64" : "lg:pl-16",
        )}
      >
        <div className="px-4 py-8 lg:px-8">
          {breadcrumbs && (
            <Breadcrumbs items={breadcrumbs} className="mb-6" />
          )}
          {(title || action) && (
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {title && <h1 className="text-3xl font-bold tracking-tight">{title}</h1>}
                {description && <p className="mt-1 text-muted-foreground">{description}</p>}
              </div>
              {action && <div className="shrink-0">{action}</div>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
