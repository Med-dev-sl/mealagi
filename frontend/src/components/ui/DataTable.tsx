import { type TableHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  header: string;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> extends TableHTMLAttributes<HTMLTableElement> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No data found",
  className,
  ...props
}: DataTableProps<T>) {
  return (
    <div className="relative overflow-hidden rounded-xl border">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props}>
        <thead>
          <tr className="border-b bg-muted/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn("h-12 px-4 text-left align-middle font-medium text-muted-foreground", col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={keyExtractor(item)} className="border-b transition-colors hover:bg-muted/50">
                {columns.map((col) => (
                  <td key={col.key} className={cn("p-4 align-middle", col.className)}>
                    {col.cell ? col.cell(item) : (item as Record<string, unknown>)[col.key] as React.ReactNode}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
