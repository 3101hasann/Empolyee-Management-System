import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { updateBatchAction } from "@/features/batches/actions";
import { BatchForm } from "@/features/batches/components/batch-form";
import { getBatchById } from "@/features/batches/queries";
import type { BatchFormInput } from "@/features/batches/schemas";
import { toDateInputValue } from "@/lib/utils/format";
import { minutesToTimeInput } from "@/lib/utils/time";
import { decodeWeekdays } from "@/lib/utils/weekdays";

export const metadata: Metadata = {
  title: "Batch",
};

export default async function BatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) notFound();

  const batch = await getBatchById(id);
  if (!batch) notFound();

  const defaultValues: BatchFormInput = {
    name: batch.name,
    status: batch.status,
    startDate: toDateInputValue(batch.startDate),
    endDate: toDateInputValue(batch.endDate),
    startTime: minutesToTimeInput(batch.startTimeMin),
    endTime: minutesToTimeInput(batch.endTimeMin),
    daysOfWeek: decodeWeekdays(batch.daysOfWeek),
    roadmap: batch.roadmap ?? "",
    comments: batch.comments ?? "",
  };

  const boundUpdate = updateBatchAction.bind(null, batch.id);

  return (
    <div className="space-y-6">
      <PageHeader title={batch.name} subtitle={`Batch List > ${batch.name}`} />
      <div className="rounded-xl bg-card p-6">
        <BatchForm defaultValues={defaultValues} onSubmitAction={boundUpdate} />
      </div>
    </div>
  );
}
