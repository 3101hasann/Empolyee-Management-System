"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useQueryParams } from "./use-query-params";

const PAGE_SIZES = ["10", "20", "50"];

/** Windowed page list: current page ±1 plus first/last. */
function pageWindow(page: number, pageCount: number): number[] {
  const pages = new Set<number>([1, pageCount, page - 1, page, page + 1]);
  return [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
}

export function Pagination({
  page,
  pageCount,
  pageSize,
  total,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
}) {
  const { setParams } = useQueryParams();

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const goTo = (target: number) => setParams({ page: String(target) });

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Showing</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) =>
            setParams({ pageSize: value === null ? null : String(value), page: null })
          }
        >
          <SelectTrigger aria-label="Rows per page" className="h-8 w-18">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={size}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {from} to {to} out of {total} records
      </p>

      <nav aria-label="Pagination" className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => goTo(page - 1)}
        >
          <ChevronLeft />
        </Button>
        {pageWindow(page, pageCount).map((target, index, all) => (
          <span key={target} className="flex items-center">
            {index > 0 && all[index - 1] !== target - 1 ? (
              <span className="px-1 text-muted-foreground">…</span>
            ) : null}
            <Button
              variant={target === page ? "outline" : "ghost"}
              size="icon"
              aria-label={`Page ${target}`}
              aria-current={target === page ? "page" : undefined}
              className={target === page ? "border-primary text-primary" : undefined}
              onClick={() => goTo(target)}
            >
              {target}
            </Button>
          </span>
        ))}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next page"
          disabled={page >= pageCount}
          onClick={() => goTo(page + 1)}
        >
          <ChevronRight />
        </Button>
      </nav>
    </div>
  );
}
