"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav className={cn("flex items-center gap-1 text-sm text-muted-foreground", className)} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const Icon = item.icon;
        return (
          <div key={item.label} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            {Icon && <Icon className="h-4 w-4" />}
            {isLast || !item.href ? (
              <span className={cn(isLast && "font-medium text-foreground")}>{item.label}</span>
            ) : (
              <Link href={item.href} className="hover:text-foreground transition-colors">
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function AutoBreadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const items: BreadcrumbItem[] = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    return { label, href };
  });

  return <Breadcrumbs items={items} className={className} />;
}
