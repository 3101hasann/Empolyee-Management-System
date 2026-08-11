"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { toast } from "sonner";

import type { ChatMessage, ToolQuery } from "./types";

interface ApiMessage {
  id: number;
  role: "USER" | "ASSISTANT";
  content: string;
  toolCalls: ToolQuery[] | null;
  createdAt: string;
}

type StreamEvent =
  | { type: "meta"; conversationId: number; title: string }
  | { type: "delta"; text: string }
  | { type: "tool"; name: string; purpose?: string; sql?: string }
  | { type: "done"; messageId: number }
  | { type: "error"; message: string };

function fromApiMessage(message: ApiMessage): ChatMessage {
  return {
    id: `db-${message.id}`,
    role: message.role === "USER" ? "user" : "assistant",
    content: message.content,
    createdAt: new Date(message.createdAt),
    queries: message.toolCalls ?? undefined,
  };
}

/**
 * Chat state shared by both assistant surfaces (full page and popup widget).
 * Both hydrate from the latest DB conversation; each surface streams its own
 * sends. Replies come from POST /api/assistant/chat as ndjson events.
 */
export function useAssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  /** Whole request in flight (composer disabled). */
  const [busy, setBusy] = useState(false);
  /** Waiting for the first token — shows the typing indicator. */
  const [isThinking, setIsThinking] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/assistant/chat");
        if (!res.ok) return;
        const data = (await res.json()) as {
          conversation: { id: number; messages: ApiMessage[] } | null;
        };
        if (cancelled || !data.conversation) return;
        setConversationId(data.conversation.id);
        setMessages(data.conversation.messages.map(fromApiMessage));
      } catch {
        // Hydration is best-effort; the chat still works from a blank state.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const send = useCallback(
    async (text: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setIsThinking(true);

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content: text, createdAt: new Date() },
      ]);

      let assistantId: string | null = null;
      const ensureAssistant = (): string => {
        if (!assistantId) {
          assistantId = crypto.randomUUID();
          const id = assistantId;
          setMessages((prev) => [
            ...prev,
            { id, role: "assistant", content: "", createdAt: new Date() },
          ]);
          setIsThinking(false);
        }
        return assistantId;
      };
      const patchAssistant = (patch: (message: ChatMessage) => ChatMessage) => {
        const id = ensureAssistant();
        setMessages((prev) => prev.map((m) => (m.id === id ? patch(m) : m)));
      };

      try {
        const res = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ conversationId, message: text }),
        });
        if (!res.ok || !res.body) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error ?? `Request failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newline = buffer.indexOf("\n");
          while (newline >= 0) {
            const line = buffer.slice(0, newline).trim();
            buffer = buffer.slice(newline + 1);
            newline = buffer.indexOf("\n");
            if (!line) continue;

            const event = JSON.parse(line) as StreamEvent;
            switch (event.type) {
              case "meta":
                setConversationId(event.conversationId);
                break;
              case "delta":
                patchAssistant((m) => ({ ...m, content: m.content + event.text }));
                break;
              case "tool":
                patchAssistant((m) => ({
                  ...m,
                  queries: [
                    ...(m.queries ?? []),
                    { name: event.name, purpose: event.purpose, sql: event.sql },
                  ],
                }));
                break;
              case "error":
                throw new Error(event.message);
              case "done":
                break;
            }
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        toast.error(message);
        patchAssistant((m) => ({
          ...m,
          content: m.content.length > 0 ? m.content : `Sorry — ${message}`,
        }));
      } finally {
        busyRef.current = false;
        setBusy(false);
        setIsThinking(false);
      }
    },
    [conversationId],
  );

  /** Starts a fresh conversation; the old one stays in the database. */
  const reset = useCallback(() => {
    if (busyRef.current) return;
    setMessages([]);
    setConversationId(null);
  }, []);

  /** Loads a past conversation picked from the history dropdown. */
  const openConversation = useCallback(async (id: number) => {
    if (busyRef.current) return;
    try {
      const res = await fetch(`/api/assistant/chat?conversationId=${id}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as {
        conversation: { id: number; messages: ApiMessage[] } | null;
      };
      if (!data.conversation) throw new Error();
      setConversationId(data.conversation.id);
      setMessages(data.conversation.messages.map(fromApiMessage));
    } catch {
      toast.error("Couldn't load that conversation.");
    }
  }, []);

  return { messages, conversationId, busy, isThinking, send, reset, openConversation };
}
