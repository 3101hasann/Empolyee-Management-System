import type { ComponentType } from "react";

import { Archive, CirclePlay, Layers, Users } from "lucide-react";

import { cn } from "@/lib/utils";

import type { DashboardKpis } from "../queries";

interface Tile {
  label: string;
  value: number;
  delta?: number;
  deltaPeriod?: string;
  note?: string;
  icon: ComponentType<{ className?: string }>;
  /* Entity color: batches wear lime, internees blue — same as the charts. */
  chipClass: string;
}

function tiles(kpis: DashboardKpis): Tile[] {
  return [
    {
      label: "Total Batches",
      value: kpis.totalBatches,
      delta: kpis.batchesThisMonth,
      deltaPeriod: "this month",
      icon: Layers,
      chipClass: "bg-primary/15 text-primary",
    },
    {
      label: "Active Batches",
      value: kpis.activeBatches,
      note: "Currently running",
      icon: CirclePlay,
      chipClass: "bg-primary/15 text-primary",
    },
    {
      label: "Closed Batches",
      value: kpis.closedBatches,
      note: "All time",
      icon: Archive,
      chipClass: "bg-primary/15 text-primary",
    },
    {
      label: "Total Internees",
      value: kpis.totalInternees,
      delta: kpis.interneesThisMonth,
      deltaPeriod: "this month",
      icon: Users,
      chipClass: "bg-secondary/15 text-secondary",
    },
  ];
}

export function KpiCards({ kpis }: { kpis: DashboardKpis }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {tiles(kpis).map((tile) => (
        <div key={tile.label} className="rounded-xl bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{tile.label}</p>
              <p className="text-3xl font-semibold">{tile.value.toLocaleString()}</p>
            </div>
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg",
                tile.chipClass,
              )}
            >
              <tile.icon className="size-5" />
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {tile.delta !== undefined ? (
              <>
                <span className={cn(tile.delta > 0 && "font-medium text-primary")}>
                  {tile.delta > 0 ? `+${tile.delta}` : "±0"}
                </span>{" "}
                {tile.deltaPeriod}
              </>
            ) : (
              tile.note
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
