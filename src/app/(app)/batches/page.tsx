import type { Metadata } from "next";

import { CirclePlus } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/data-table/empty-state";
import { Pagination } from "@/components/shared/data-table/pagination";
import { SearchInput } from "@/components/shared/data-table/search-input";
import { SelectFilter } from "@/components/shared/data-table/select-filter";
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
import { BatchRowActions } from "@/features/batches/components/batch-row-actions";
import { listBatches } from "@/features/batches/queries";
import { formatDate } from "@/lib/utils/format";
import { minutesTo12Hour } from "@/lib/utils/time";
import { countWeekdays, formatWeekdays } from "@/lib/utils/weekdays";

export const metadata: Metadata = {
  title: "Batches",
};

const STATUS_OPTIONS = [
  { value: "UPCOMING", label: "Upcoming" },
  { value: "ACTIVE", label: "Active" },
  { value: "CLOSED", label: "Closed" },
];

export default async function BatchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { rows, total, page, pageSize, pageCount } = await listBatches({
    page: typeof params.page === "string" ? params.page : undefined,
    pageSize: typeof params.pageSize === "string" ? params.pageSize : undefined,
    q: typeof params.q === "string" ? params.q : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
  } as Parameters<typeof listBatches>[0]);

  return (
    <div className="space-y-6">
      <PageHeader title="Batches" subtitle="List of all batches" />

      <div className="space-y-4 rounded-xl bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <SearchInput placeholder="Search" />
            <SelectFilter
              paramName="status"
              options={STATUS_OPTIONS}
              allLabel="All statuses"
              ariaLabel="Filter by status"
            />
          </div>
          {/* The Figma list pages use the blue secondary for this toolbar CTA. */}
          <Button
            className="h-10 bg-secondary text-secondary-foreground hover:bg-secondary/90"
            nativeButton={false}
            render={<Link href="/batches/new" />}
          >
            <CirclePlus data-icon="inline-start" />
            Create New Batch
          </Button>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="No batches found"
            description="Try a different search or create your first batch."
            action={
              <Button nativeButton={false} render={<Link href="/batches/new" />}>
                Create New Batch
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Days Of Week</TableHead>
                <TableHead>No. Of Interns</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-mono text-muted-foreground">
                    {batch.id}
                  </TableCell>
                  <TableCell className="font-medium">{batch.name}</TableCell>
                  <TableCell>{formatDate(batch.startDate)}</TableCell>
                  <TableCell>{formatDate(batch.endDate)}</TableCell>
                  <TableCell>{minutesTo12Hour(batch.startTimeMin)}</TableCell>
                  <TableCell>{minutesTo12Hour(batch.endTimeMin)}</TableCell>
                  <TableCell title={formatWeekdays(batch.daysOfWeek)}>
                    {countWeekdays(batch.daysOfWeek)}
                  </TableCell>
                  <TableCell>{batch._count.tenures}</TableCell>
                  <TableCell>
                    <StatusChip status={batch.status} />
                  </TableCell>
                  <TableCell>
                    <BatchRowActions id={batch.id} name={batch.name} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Pagination page={page} pageCount={pageCount} pageSize={pageSize} total={total} />
      </div>
    </div>
  );
}
