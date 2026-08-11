import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { createBatchAction } from "@/features/batches/actions";
import { BatchForm } from "@/features/batches/components/batch-form";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Create Batch",
};

export default async function CreateBatchPage() {
  await requirePermission("batch:create");

  return (
    <div className="space-y-6">
      <PageHeader title="Create Batch" subtitle="Batch List > Create New Batch" />
      <div className="rounded-xl bg-card p-6">
        <BatchForm onSubmitAction={createBatchAction} />
      </div>
    </div>
  );
}
