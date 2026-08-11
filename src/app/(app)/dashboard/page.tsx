import type { Metadata } from "next";

import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { StatusChip } from "@/components/shared/status-chip";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ComparisonChart } from "@/features/dashboard/components/comparison-chart";
import { KpiCards } from "@/features/dashboard/components/kpi-cards";
import { StatsChart } from "@/features/dashboard/components/stats-chart";
import {
  getDashboardKpis,
  getMonthlySeries,
  getRecentBatches,
} from "@/features/dashboard/queries";
import { requirePermission } from "@/lib/auth/guards";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await requirePermission("dashboard:read");
  const year = new Date().getUTCFullYear();

  const [kpis, monthly, recentBatches] = await Promise.all([
    getDashboardKpis(),
    getMonthlySeries(year),
    getRecentBatches(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <>
            Hello {user.name}{" "}
            <span aria-hidden="true" role="img">
              👋
            </span>
          </>
        }
        subtitle="Here's what's happening with your batches and internees"
      />

      <KpiCards kpis={kpis} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="rounded-xl bg-card p-5 xl:col-span-3">
          <StatsChart data={monthly} year={year} />
        </div>
        <div className="rounded-xl bg-card p-5 xl:col-span-2">
          <ComparisonChart data={monthly} />
        </div>
      </div>

      <div className="space-y-4 rounded-xl bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Recent Batches</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-secondary hover:text-secondary"
            nativeButton={false}
            render={<Link href="/batches" />}
          >
            View All
          </Button>
        </div>
        {recentBatches.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No batches yet — create your first one to see it here.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="text-right">Interns</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBatches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-mono text-muted-foreground">
                    {batch.id}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/batches/${batch.id}`}
                      className="font-medium hover:underline"
                    >
                      {batch.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={batch.status} />
                  </TableCell>
                  <TableCell>{formatDate(batch.startDate)}</TableCell>
                  <TableCell>{formatDate(batch.endDate)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {batch._count.tenures}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
