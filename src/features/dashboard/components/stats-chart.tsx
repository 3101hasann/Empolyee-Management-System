"use client";

import { useState } from "react";

import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

import type { MonthlyPoint } from "../queries";

// Color follows the entity across the whole dashboard:
// batches = lime (chart-2), internees = blue (chart-1).
const CONFIG = {
  batches: { label: "Batches", color: "var(--chart-2)" },
  internees: { label: "Internees", color: "var(--chart-1)" },
} satisfies ChartConfig;

type SeriesKey = keyof typeof CONFIG;

export function StatsChart({ data, year }: { data: MonthlyPoint[]; year: number }) {
  const [series, setSeries] = useState<SeriesKey>("batches");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Stats</h2>
        <div className="flex items-center gap-3">
          {/* Single-series chart: the toggle names what is plotted, so no legend. */}
          <div className="flex rounded-lg border border-border/60 p-0.5">
            {(Object.keys(CONFIG) as SeriesKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSeries(key)}
                aria-pressed={series === key}
                className={cn(
                  "rounded-md px-3 py-1 text-xs transition-colors",
                  series === key
                    ? "bg-accent font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {CONFIG[key].label}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">This Year · {year}</span>
        </div>
      </div>

      <ChartContainer config={CONFIG} className="h-64 w-full">
        <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeWidth={1}
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickMargin={8}
          />
          <YAxis
            allowDecimals={false}
            width={32}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <ChartTooltip cursor={{ stroke: "var(--border)" }} content={<ChartTooltipContent />} />
          {/* Area = 10% wash of the series hue; the 2px line carries the data. */}
          <Area
            type="monotone"
            dataKey={series}
            fill={CONFIG[series].color}
            fillOpacity={0.1}
            stroke="none"
            // The wash duplicates the line's dataKey — keep it out of the tooltip.
            tooltipType="none"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey={series}
            stroke={CONFIG[series].color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={false}
            // ≥8px marker with a 2px surface ring where it sits on the line.
            activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}
