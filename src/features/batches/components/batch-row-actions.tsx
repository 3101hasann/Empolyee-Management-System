"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";

import { deleteBatchAction } from "../actions";

export function BatchRowActions({ id, name }: { id: number; name: string }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`View batch ${name}`}
        nativeButton={false}
        render={<Link href={`/batches/${id}`} />}
      >
        <Eye />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Edit batch ${name}`}
        nativeButton={false}
        render={<Link href={`/batches/${id}`} />}
      >
        <Pencil />
      </Button>
      <ConfirmDialog
        trigger={
          <Button variant="ghost" size="icon" aria-label={`Delete batch ${name}`}>
            <Trash2 />
          </Button>
        }
        title="Delete batch?"
        description={`"${name}" will be removed from all lists. Its history is preserved and interns already assigned keep their tenure records.`}
        onConfirm={async () => {
          const result = await deleteBatchAction(id);
          if (result.ok) {
            toast.success("Batch deleted");
          } else {
            toast.error(result.error);
          }
        }}
      />
    </div>
  );
}
