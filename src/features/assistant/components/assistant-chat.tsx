"use client";

import { useEffect, useRef } from "react";

import {
  CalendarClock,
  CircleCheck,
  CirclePlus,
  SquarePen,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useAssistantChat } from "../use-assistant-chat";
import { ChatComposer } from "./chat-composer";
import { AssistantAvatar, ChatMessageRow, TypingIndicator } from "./chat-message";
import { ConversationHistory } from "./conversation-history";

interface Suggestion {
  icon: LucideIcon;
  label: string;
  /** Queries take the blue accent, actions the lime one (EMS color jobs). */
  tone: "query" | "action";
}

const SUGGESTIONS: Suggestion[] = [
  { icon: Users, label: "How many internees joined this month?", tone: "query" },
  { icon: CalendarClock, label: "Which batches are ending soon?", tone: "query" },
  { icon: CirclePlus, label: "Create a new batch for winter", tone: "action" },
  { icon: CircleCheck, label: "Close the batch that just ended", tone: "action" },
];

export function EmptyState({
  onPick,
  compact = false,
}: {
  onPick: (text: string) => void;
  /** Tighter layout for the popup widget. */
  compact?: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <AssistantAvatar
        className={compact ? "size-10 rounded-xl [&_svg]:size-5" : "size-14 rounded-2xl [&_svg]:size-6"}
      />
      <div className="space-y-1.5">
        <h2 className={cn("font-bold", compact ? "text-lg" : "text-2xl")}>Hello, Admin</h2>
        <p className="mx-auto max-w-md text-sm font-light text-muted-foreground">
          I can answer questions about your batches and internees — or do the work
          for you. Try one of these to get started.
        </p>
      </div>
      <div
        className={cn(
          "mt-2 grid w-full max-w-2xl gap-3",
          !compact && "sm:grid-cols-2",
        )}
      >
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.label}
            type="button"
            onClick={() => onPick(suggestion.label)}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-border bg-input/30 px-4 text-left text-sm font-light transition-colors hover:border-primary/40 hover:bg-muted/60",
              compact ? "py-2.5" : "py-3.5",
            )}
          >
            <suggestion.icon
              className={cn(
                "size-4 shrink-0",
                suggestion.tone === "action" ? "text-primary" : "text-secondary",
              )}
            />
            {suggestion.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AssistantChat() {
  const { messages, conversationId, busy, isThinking, send, reset, openConversation } =
    useAssistantChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isThinking]);

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-xl bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <AssistantAvatar />
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold">
              EMS Assistant
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                Beta
              </span>
            </p>
            <p className="text-xs font-light text-muted-foreground">
              Queries and actions across batches, internees and tenures
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ConversationHistory activeId={conversationId} onSelect={openConversation} />
          <Button variant="ghost" onClick={reset} disabled={messages.length === 0 || busy}>
            <SquarePen data-icon="inline-start" />
            New Chat
          </Button>
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-6">
        {messages.length === 0 ? (
          <EmptyState onPick={send} />
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
            {messages.map((message) => (
              <ChatMessageRow key={message.id} message={message} />
            ))}
            {isThinking ? <TypingIndicator /> : null}
          </div>
        )}
      </div>

      <div className="border-t border-border px-4 py-4 md:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <ChatComposer onSend={send} busy={busy} />
          <p className="mt-2 text-center text-[11px] font-light text-muted-foreground/80">
            Answers come from your EMS database. Verify important numbers before
            acting on them.
          </p>
        </div>
      </div>
    </section>
  );
}
