"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import type { MonthlyPoint } from "../queries";

// Same entity colors as the stats chart — color follows the entity.
const CONFIG = {
  batches: { label: "Batches", color: "var(--chart-2)" },
  internees: { label: "Internees", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function ComparisonChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Comparison</h2>
      <ChartContainer config={CONFIG} className="h-64 w-full">
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
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
          <ChartTooltip cursor={{ fill: "var(--accent)", opacity: 0.4 }} content={<ChartTooltipContent />} />
          {/* Two series → legend is required (identity never rides color alone). */}
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="batches"
            fill="var(--color-batches)"
            maxBarSize={18}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="internees"
            fill="var(--color-internees)"
            maxBarSize={18}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
