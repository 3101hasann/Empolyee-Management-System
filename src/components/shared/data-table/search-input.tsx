"use client";

import { useEffect, useRef, useState } from "react";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

import { useQueryParams } from "./use-query-params";

const DEBOUNCE_MS = 350;

export function SearchInput({ placeholder = "Search" }: { placeholder?: string }) {
  const { searchParams, setParams } = useQueryParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const handle = setTimeout(() => {
      // Any new search resets to the first page.
      setParams({ q: value.trim(), page: null });
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // setParams identity changes with the URL; depending on it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-full max-w-xs">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 pl-9"
      />
    </div>
  );
}
