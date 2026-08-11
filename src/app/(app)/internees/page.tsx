import type { Metadata } from "next";

import { CirclePlus } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/data-table/empty-state";
import { Pagination } from "@/components/shared/data-table/pagination";
import { SearchInput } from "@/components/shared/data-table/search-input";
import { SelectFilter } from "@/components/shared/data-table/select-filter";
import { PageHeader } from "@/components/shared/page-header";
import { StatusChip } from "@/components/shared/status-chip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getBatchOptions } from "@/features/batches/queries";
import { InterneeRowActions } from "@/features/internees/components/internee-row-actions";
import { listInternees } from "@/features/internees/queries";

export const metadata: Metadata = {
  title: "Internees",
};

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

const GENDER_LABELS: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

export default async function InterneesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const [{ rows, total, page, pageSize, pageCount }, batches] = await Promise.all([
    listInternees({
      page: typeof params.page === "string" ? params.page : undefined,
      pageSize: typeof params.pageSize === "string" ? params.pageSize : undefined,
      q: typeof params.q === "string" ? params.q : undefined,
      batchId: typeof params.batchId === "string" ? params.batchId : undefined,
      gender: typeof params.gender === "string" ? params.gender : undefined,
    } as Parameters<typeof listInternees>[0]),
    getBatchOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Internees" subtitle="List of all internees" />

      <div className="space-y-4 rounded-xl bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <SearchInput placeholder="Search" />
            <SelectFilter
              paramName="batchId"
              options={batches.map((batch) => ({
                value: String(batch.id),
                label: batch.name,
              }))}
              allLabel="All batches"
              ariaLabel="Filter by batch"
            />
            <SelectFilter
              paramName="gender"
              options={GENDER_OPTIONS}
              allLabel="All genders"
              ariaLabel="Filter by gender"
            />
          </div>
          {/* List-page toolbar CTAs are blue per the design language. */}
          <Button
            className="h-10 bg-secondary text-secondary-foreground hover:bg-secondary/90"
            nativeButton={false}
            render={<Link href="/internees/new" />}
          >
            <CirclePlus data-icon="inline-start" />
            Add New Internee
          </Button>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="No internees found"
            description="Try a different search or add your first internee."
            action={
              <Button nativeButton={false} render={<Link href="/internees/new" />}>
                Add New Internee
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Intern ID</TableHead>
                <TableHead>Internee Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((internee) => {
                const fullName = `${internee.person.firstName} ${internee.person.lastName}`;
                const latestTenure = internee.tenures[0];
                return (
                  <TableRow key={internee.id}>
                    <TableCell className="font-mono text-muted-foreground">
                      {internee.id}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2.5">
                        <Avatar className="size-8">
                          {internee.person.profileImagePath ? (
                            <AvatarImage
                              src={`/api/files/${internee.person.profileImagePath}`}
                              alt=""
                            />
                          ) : null}
                          <AvatarFallback>
                            {internee.person.firstName[0]}
                            {internee.person.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{fullName}</span>
                      </span>
                    </TableCell>
                    <TableCell>{internee.person.email}</TableCell>
                    <TableCell>{internee.person.phone ?? "—"}</TableCell>
                    <TableCell>
                      {internee.person.gender ? GENDER_LABELS[internee.person.gender] : "—"}
                    </TableCell>
                    <TableCell>{internee.person.city?.name ?? "—"}</TableCell>
                    <TableCell>
                      {latestTenure ? (
                        <StatusChip
                          status={latestTenure.batch.status}
                          label={latestTenure.batch.name}
                        />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <InterneeRowActions id={internee.id} name={fullName} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <Pagination page={page} pageCount={pageCount} pageSize={pageSize} total={total} />
      </div>
    </div>
  );
}
