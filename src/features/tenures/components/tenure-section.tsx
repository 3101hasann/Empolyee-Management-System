"use client";

import { useState } from "react";

import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
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
import type { LookupOption } from "@/features/lookups/queries";
import { formatDate } from "@/lib/utils/format";

import { deleteTenureAction } from "../actions";
import type { TenureDto } from "../dto";
import { TenureForm, type BatchOption } from "./tenure-form";

function displayDate(value: string): string {
  return formatDate(new Date(`${value}T00:00:00.000Z`));
}

export function TenureSection({
  interneeId,
  tenures,
  batches,
  institutes,
  degrees,
}: {
  interneeId: number;
  tenures: TenureDto[];
  batches: BatchOption[];
  institutes: LookupOption[];
  degrees: LookupOption[];
}) {
  const [editing, setEditing] = useState<TenureDto | null>(null);

  return (
    <div className="space-y-8">
      {editing ? (
        <p className="text-sm text-muted-foreground">
          Editing tenure <span className="font-mono">{editing.id}</span> — saving will
          update it; Cancel returns to adding a new tenure.
        </p>
      ) : null}
      <TenureForm
        key={editing?.id ?? "new"}
        interneeId={interneeId}
        tenure={editing ?? undefined}
        batches={batches}
        institutes={institutes}
        degrees={degrees}
        onDone={() => setEditing(null)}
      />

      {tenures.length > 0 ? (
        <div className="rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenure ID</TableHead>
                <TableHead>Batch Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Institute</TableHead>
                <TableHead>Degree</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenures.map((tenure) => (
                <TableRow key={tenure.id}>
                  <TableCell className="font-mono text-muted-foreground">
                    {tenure.id}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={tenure.batchStatus} label={tenure.batchName} />
                  </TableCell>
                  <TableCell>{displayDate(tenure.startDate)}</TableCell>
                  <TableCell>{displayDate(tenure.endDate)}</TableCell>
                  <TableCell>{tenure.instituteName ?? "—"}</TableCell>
                  <TableCell>{tenure.degreeName ?? "—"}</TableCell>
                  <TableCell>{tenure.semester ?? "—"}</TableCell>
                  <TableCell>{tenure.grade ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit tenure ${tenure.id}`}
                        onClick={() => setEditing(tenure)}
                      >
                        <Pencil />
                      </Button>
                      <ConfirmDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete tenure ${tenure.id}`}
                          >
                            <Trash2 />
                          </Button>
                        }
                        title="Delete tenure?"
                        description={`The ${tenure.batchName} tenure will be removed from all lists. History is preserved in the database.`}
                        onConfirm={async () => {
                          const result = await deleteTenureAction(tenure.id);
                          if (result.ok) {
                            toast.success("Tenure deleted");
                            if (editing?.id === tenure.id) setEditing(null);
                          } else {
                            toast.error(result.error);
                          }
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
