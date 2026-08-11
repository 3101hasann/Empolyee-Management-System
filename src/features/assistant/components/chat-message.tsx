"use client";

import { Check, ClipboardCheck, Database, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ActionOutcome, ActionPreview, ChatMessage, ToolQuery } from "../types";

const timeFormat = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" });

/** Lime-gradient sparkle mark — the assistant's visual identity (login-button gradient). */
export function AssistantAvatar({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#5d973f] to-[#b6d232]",
        className,
      )}
    >
      <Sparkles className="size-4 text-primary-foreground" />
    </span>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <AssistantAvatar />
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-muted/50 px-4 py-3.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Audit trail: which queries produced this answer. */
function QueryTrace({ queries }: { queries: ToolQuery[] }) {
  return (
    <details className="group w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-xs">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-muted-foreground select-none [&::-webkit-details-marker]:hidden">
        <Database className="size-3 text-secondary" />
        {queries.length === 1 ? "View query" : `View queries (${queries.length})`}
      </summary>
      <div className="mt-2 space-y-2">
        {queries.map((query, index) => (
          <div key={index} className="space-y-1">
            <p className="font-light text-muted-foreground">
              {query.purpose ?? (query.name === "get_overview" ? "Fetched overview numbers" : query.name)}
            </p>
            {query.sql ? (
              <pre className="overflow-x-auto rounded-md bg-background/60 p-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-foreground/80">
                {query.sql}
              </pre>
            ) : null}
          </div>
        ))}
      </div>
    </details>
  );
}

function ActionPreviewCard({
  action,
  outcome,
  onResolve,
}: {
  action: ActionPreview;
  outcome?: ActionOutcome;
  onResolve: (outcome: ActionOutcome) => void;
}) {
  return (
    <div className="w-full min-w-[280px] rounded-xl border border-border bg-background/50 p-4">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="size-4 text-primary" />
        <p className="text-sm font-semibold">{action.title}</p>
      </div>
      <dl className="mt-3 space-y-1.5">
        {action.fields.map((field) => (
          <div key={field.label} className="flex items-baseline justify-between gap-6 text-sm">
            <dt className="font-light text-muted-foreground">{field.label}</dt>
            <dd className="text-right">{field.value}</dd>
          </div>
        ))}
      </dl>
      {outcome ? (
        <p
          className={cn(
            "mt-3 flex items-center gap-1.5 text-xs",
            outcome === "confirmed" ? "text-primary" : "text-muted-foreground",
          )}
        >
          {outcome === "confirmed" ? (
            <>
              <Check className="size-3.5" /> Confirmed
            </>
          ) : (
            "Dismissed"
          )}
        </p>
      ) : (
        <div className="mt-4 flex justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => onResolve("dismissed")}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => onResolve("confirmed")}>
            Confirm
          </Button>
        </div>
      )}
    </div>
  );
}

export function ChatMessageRow({
  message,
  onResolveAction,
}: {
  message: ChatMessage;
  /** Optional until actions ship (phase 2). */
  onResolveAction?: (messageId: string, outcome: ActionOutcome) => void;
}) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "justify-end")}>
      {!isUser && <AssistantAvatar />}
      <div className={cn("flex max-w-[75%] flex-col gap-2", isUser && "items-end")}>
        {message.content.length > 0 ? (
          <div
            className={cn(
              "rounded-2xl px-4 py-2.5 text-sm leading-relaxed font-light whitespace-pre-line",
              isUser
                ? "rounded-br-md border border-secondary/25 bg-secondary/20"
                : "rounded-tl-md bg-muted/50",
            )}
          >
            {message.content}
          </div>
        ) : null}
        {message.queries && message.queries.length > 0 ? (
          <QueryTrace queries={message.queries} />
        ) : null}
        {message.action ? (
          <ActionPreviewCard
            action={message.action}
            outcome={message.actionOutcome}
            onResolve={(outcome) => onResolveAction?.(message.id, outcome)}
          />
        ) : null}
        <span className="px-1 text-[11px] text-muted-foreground/70">
          {timeFormat.format(message.createdAt)}
        </span>
      </div>
    </div>
  );
}
