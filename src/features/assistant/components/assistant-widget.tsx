"use client";

import { useEffect, useRef, useState } from "react";

import { Maximize2, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

import { useAssistantChat } from "../use-assistant-chat";
import { EmptyState } from "./assistant-chat";
import { ChatComposer } from "./chat-composer";
import { AssistantAvatar, ChatMessageRow, TypingIndicator } from "./chat-message";
import { ConversationHistory } from "./conversation-history";

/**
 * Floating assistant launcher shown on every authenticated page except
 * /assistant itself (which hosts the full-page surface, see AssistantChat).
 */
export function AssistantWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { messages, conversationId, busy, isThinking, send, openConversation } =
    useAssistantChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isThinking, open]);

  if (pathname.startsWith("/assistant")) return null;

  return (
    <>
      {open ? (
        <div
          role="dialog"
          aria-label="EMS Assistant"
          className="fixed right-6 bottom-24 z-50 flex h-[min(600px,calc(100svh-8rem))] w-[min(400px,calc(100vw-3rem))] flex-col rounded-2xl border border-border bg-card shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border p-3">
            <div className="flex items-center gap-2.5">
              <AssistantAvatar />
              <p className="flex items-center gap-2 text-sm font-semibold">
                EMS Assistant
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                  Beta
                </span>
              </p>
            </div>
            <div className="flex items-center gap-1">
              <ConversationHistory
                activeId={conversationId}
                onSelect={openConversation}
                iconOnly
              />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Open full assistant page"
                nativeButton={false}
                render={<Link href="/assistant" />}
                onClick={() => setOpen(false)}
              >
                <Maximize2 />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close assistant"
                onClick={() => setOpen(false)}
              >
                <X />
              </Button>
            </div>
          </div>

          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <EmptyState onPick={send} compact />
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map((message) => (
                  <ChatMessageRow key={message.id} message={message} />
                ))}
                {isThinking ? <TypingIndicator /> : null}
              </div>
            )}
          </div>

          <div className="border-t border-border p-3">
            <ChatComposer onSend={send} busy={busy} />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        aria-expanded={open}
        className="fixed right-6 bottom-6 z-50 flex size-14 items-center justify-center rounded-full bg-gradient-to-b from-[#5d973f] to-[#b6d232] text-primary-foreground shadow-lg shadow-black/40 transition-transform hover:scale-105 active:scale-95"
      >
        {open ? <X className="size-6" /> : <Sparkles className="size-6" />}
      </button>
    </>
  );
}
