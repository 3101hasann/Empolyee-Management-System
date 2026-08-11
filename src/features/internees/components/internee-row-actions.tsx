"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";

import { deleteInterneeAction } from "../actions";

export function InterneeRowActions({ id, name }: { id: number; name: string }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`View ${name}`}
        nativeButton={false}
        render={<Link href={`/internees/${id}`} />}
      >
        <Eye />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Edit ${name}`}
        nativeButton={false}
        render={<Link href={`/internees/${id}`} />}
      >
        <Pencil />
      </Button>
      <ConfirmDialog
        trigger={
          <Button variant="ghost" size="icon" aria-label={`Delete ${name}`}>
            <Trash2 />
          </Button>
        }
        title="Delete internee?"
        description={`"${name}" and their tenure records will be removed from all lists. History is preserved in the database.`}
        onConfirm={async () => {
          const result = await deleteInterneeAction(id);
          if (result.ok) {
            toast.success("Internee deleted");
          } else {
            toast.error(result.error);
          }
        }}
      />
    </div>
  );
}
