"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useQueryParams } from "./use-query-params";

const ALL = "__all__";

export interface SelectFilterOption {
  value: string;
  label: string;
}

/** Generic URL-backed dropdown filter (batch status, internee batch, ...). */
export function SelectFilter({
  paramName,
  options,
  allLabel = "All",
  ariaLabel,
}: {
  paramName: string;
  options: SelectFilterOption[];
  allLabel?: string;
  ariaLabel: string;
}) {
  const { searchParams, setParams } = useQueryParams();
  const current = searchParams.get(paramName) ?? ALL;
  const items = {
    [ALL]: allLabel,
    ...Object.fromEntries(options.map((option) => [option.value, option.label])),
  };

  return (
    <Select
      items={items}
      value={current}
      onValueChange={(value) => {
        setParams({
          [paramName]: value === ALL || value === null ? null : String(value),
          page: null,
        });
      }}
    >
      <SelectTrigger aria-label={ariaLabel} className="h-10 w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
