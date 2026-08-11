"use client";

import { useState } from "react";

import { ArrowUp } from "lucide-react";

export function ChatComposer({
  onSend,
  busy,
}: {
  onSend: (text: string) => void;
  busy: boolean;
}) {
  const [value, setValue] = useState("");
  const canSend = !busy && value.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <div className="flex items-end gap-2 rounded-xl border border-input bg-input/30 p-2 pl-4 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        rows={1}
        placeholder="Ask a question or describe an action…"
        aria-label="Message the assistant"
        className="field-sizing-content max-h-40 flex-1 resize-none bg-transparent py-2 text-sm font-light outline-none placeholder:text-muted-foreground"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!canSend}
        aria-label="Send message"
        className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-b from-[#5d973f] to-[#b6d232] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        <ArrowUp className="size-4" />
      </button>
    </div>
  );
}
