"use client";

import { useEffect, useRef, useState } from "react";

import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConversationSummary {
  id: number;
  title: string;
  updatedAt: string;
  messageCount: number;
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(date);
  }
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

/**
 * "History" dropdown listing past conversations; picking one loads it into
 * the chat via onSelect. Fetches the list each time it opens (cheap, fresh).
 */
export function ConversationHistory({
  activeId,
  onSelect,
  iconOnly = false,
}: {
  activeId: number | null;
  onSelect: (id: number) => void;
  /** Compact trigger for the popup widget's header. */
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ConversationSummary[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/assistant/conversations");
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { conversations: ConversationSummary[] };
        if (!cancelled) setItems(data.conversations);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {iconOnly ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Conversation history"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          <History />
        </Button>
      ) : (
        <Button variant="ghost" aria-expanded={open} onClick={() => setOpen((prev) => !prev)}>
          <History data-icon="inline-start" />
          History
        </Button>
      )}

      {open ? (
        <div className="absolute top-full right-0 z-50 mt-2 max-h-80 w-72 overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-xl shadow-black/40">
          {items === null ? (
            <p className="px-3 py-2 text-sm font-light text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-2 text-sm font-light text-muted-foreground">
              No conversations yet.
            </p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full flex-col gap-0.5 rounded-lg border-l-2 border-transparent px-3 py-2 text-left transition-colors hover:bg-muted/60",
                  item.id === activeId && "border-primary bg-muted/40",
                )}
              >
                <span className="truncate text-sm font-light">{item.title}</span>
                <span className="text-[11px] text-muted-foreground">
                  {formatWhen(item.updatedAt)} · {item.messageCount}{" "}
                  {item.messageCount === 1 ? "message" : "messages"}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
