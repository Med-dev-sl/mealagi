import { cn } from "@/lib/utils";
import { Card, CardContent } from "./Card";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: { value: number; positive: boolean };
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({ title, value, description, trend, icon: Icon, className }: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {Icon && (
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-sm font-medium",
                trend.positive ? "text-emerald-600" : "text-red-600",
              )}
            >
              {trend.positive ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {trend.value}%
            </span>
          )}
        </div>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}
