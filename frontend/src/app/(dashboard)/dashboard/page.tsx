"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { FolderKanban, Activity, Users, Target, AlertCircle, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";

const recentProjects = [
  { id: "1", name: "Health Outreach Program", status: "Active", progress: "75%", deadline: "Dec 2026" },
  { id: "2", name: "Education for All", status: "Active", progress: "45%", deadline: "Mar 2027" },
  { id: "3", name: "Water Sanitation Initiative", status: "At Risk", progress: "30%", deadline: "Sep 2026" },
  { id: "4", name: "Women Empowerment", status: "Draft", progress: "10%", deadline: "Jun 2027" },
];

const statusBadge = (status: string) => {
  const map: Record<string, "success" | "warning" | "secondary" | "outline"> = {
    Active: "success",
    "At Risk": "warning",
    Draft: "secondary",
    Completed: "outline",
  };
  return <Badge variant={map[status] || "secondary"}>{status}</Badge>;
};

export default function DashboardPage() {
  return (
    <DashboardShell
      title="Dashboard"
      description="Overview of your MEAL programs and activities"
      breadcrumbs={[{ label: "Dashboard" }]}
      action={
        <Link href="/dashboard/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      }
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Projects" value="12" description="Across 4 organizations" icon={FolderKanban} trend={{ value: 8, positive: true }} />
        <StatCard title="Indicators Tracked" value="156" description="With 89 targets met" icon={Target} trend={{ value: 12, positive: true }} />
        <StatCard title="Team Members" value="48" description="From 6 organizations" icon={Users} trend={{ value: 4, positive: true }} />
        <StatCard title="Overdue Tasks" value="3" description="Requiring attention" icon={AlertCircle} trend={{ value: 2, positive: false }} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Projects</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/projects">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: "name", header: "Project Name" },
                { key: "status", header: "Status", cell: (item) => statusBadge(item.status) },
                { key: "progress", header: "Progress" },
                { key: "deadline", header: "Deadline" },
              ]}
              data={recentProjects}
              keyExtractor={(item) => item.id}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { icon: Activity, text: "Indicator 'Beneficiaries Reached' updated", time: "2 hours ago" },
                { icon: Users, text: "John joined Health Outreach Program", time: "4 hours ago" },
                { icon: Target, text: "Target Q3 2025 achieved for Water Sanitation", time: "1 day ago" },
                { icon: Activity, text: "New report generated: Q2 Progress Report", time: "2 days ago" },
                { icon: Users, text: "Sarah was assigned as PM for Education", time: "3 days ago" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-sm">{item.text}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
