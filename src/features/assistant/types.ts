export type ActionOutcome = "confirmed" | "dismissed";

/** A side-effecting operation the assistant proposes; the admin must confirm it. (Phase 2 — actions.) */
export interface ActionPreview {
  title: string;
  fields: { label: string; value: string }[];
}

/** One tool call the assistant made while answering — shown in the "view query" audit UI. */
export interface ToolQuery {
  name: string;
  purpose?: string;
  sql?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  /** Tool-call trace behind this answer. */
  queries?: ToolQuery[];
  /** Set when the assistant proposes an action that needs admin confirmation. */
  action?: ActionPreview;
  /** How the admin resolved the proposed action, once they have. */
  actionOutcome?: ActionOutcome;
}
