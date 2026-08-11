import { Badge } from "@/components/ui/badge";
import type { BatchStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

const STYLES: Record<BatchStatus, { label: string; className: string }> = {
  UPCOMING: {
    label: "Upcoming",
    className: "bg-secondary/15 text-secondary border-secondary/30",
  },
  ACTIVE: {
    label: "Active",
    className: "bg-primary/15 text-primary border-primary/30",
  },
  CLOSED: {
    label: "Closed",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

export function StatusChip({
  status,
  label,
}: {
  status: BatchStatus;
  /** Override text, e.g. a batch name tinted by that batch's status. */
  label?: string;
}) {
  const style = STYLES[status];
  return (
    <Badge className={cn("font-medium", style.className)}>
      {label ?? style.label}
    </Badge>
  );
}
