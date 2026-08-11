import OpenAI from "openai";
import { z } from "zod";

import { executeTool, toolDefinitions, type ToolTraceEntry } from "@/features/assistant/server/tools";
import { allowChatMessage } from "@/features/assistant/server/rate-limit";
import { buildSystemPrompt } from "@/features/assistant/server/system-prompt";
import { getSessionUser } from "@/lib/auth/guards";
import { roleHasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

const HISTORY_LIMIT = 30;
const MAX_MODEL_TURNS = 6;

const bodySchema = z.object({
  conversationId: z.number().int().positive().nullish(),
  message: z.string().trim().min(1).max(2000),
});

/** Server-sent line events: meta | delta | tool | done | error (ndjson). */
type StreamEvent =
  | { type: "meta"; conversationId: number; title: string }
  | { type: "delta"; text: string }
  | { type: "tool"; name: string; purpose?: string; sql?: string }
  | { type: "done"; messageId: number }
  | { type: "error"; message: string };

async function requireApiUser() {
  const user = await getSessionUser();
  if (!user) return { error: json({ error: "Unauthorized" }, 401) } as const;
  if (!roleHasPermission(user.role, "assistant:use")) {
    return { error: json({ error: "Forbidden" }, 403) } as const;
  }
  return { user } as const;
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * One conversation with messages — the latest by default, or a specific one
 * via ?conversationId= (used by the history dropdown). Hydrates the chat UI.
 */
export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const idParam = new URL(request.url).searchParams.get("conversationId");
  let idFilter: { id: number } | undefined;
  if (idParam !== null) {
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) return json({ error: "Invalid conversationId" }, 400);
    idFilter = { id };
  }

  const conversation = await db.conversation.findFirst({
    where: { userId: Number(auth.user.id), deletedAt: null, ...idFilter },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 100,
        select: { id: true, role: true, content: true, toolCalls: true, createdAt: true },
      },
    },
  });

  return json({ conversation });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const userId = Number(auth.user.id);

  if (!allowChatMessage(auth.user.id)) {
    return json({ error: "Too many messages — wait a few minutes and try again." }, 429);
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: "Invalid request body" }, 400);
  }
  const { conversationId, message } = parsed.data;

  if (!process.env.OPENAI_API_KEY) {
    return json(
      { error: "OPENAI_API_KEY is not configured. Add it to .env and restart the dev server." },
      500,
    );
  }

  // Resolve or create the conversation (ownership enforced by userId filter).
  let conversation = conversationId
    ? await db.conversation.findFirst({
        where: { id: conversationId, userId, deletedAt: null },
      })
    : null;
  if (!conversation) {
    conversation = await db.conversation.create({
      data: { userId, title: message.slice(0, 120) },
    });
  }

  await db.chatMessage.create({
    data: { conversationId: conversation.id, role: "USER", content: message },
  });
  await db.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  const history = await db.chatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
    select: { role: true, content: true },
  });

  const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt() },
    ...history
      .reverse()
      .filter((m) => m.content.length > 0)
      .map((m) => ({
        role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      })),
  ];

  const openai = new OpenAI();
  const model = process.env.OPENAI_MODEL ?? "gpt-5-mini";
  const convId = conversation.id;
  const convTitle = conversation.title;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: StreamEvent) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));

      emit({ type: "meta", conversationId: convId, title: convTitle });

      let assistantText = "";
      const toolTrace: ToolTraceEntry[] = [];

      try {
        for (let turn = 0; turn < MAX_MODEL_TURNS; turn++) {
          const completion = await openai.chat.completions.create({
            model,
            messages: openaiMessages,
            tools: toolDefinitions,
            stream: true,
          });

          let finishReason: string | null = null;
          let turnText = "";
          const toolCalls = new Map<
            number,
            { id: string; name: string; arguments: string }
          >();

          for await (const chunk of completion) {
            const choice = chunk.choices[0];
            if (!choice) continue;
            const delta = choice.delta;

            if (delta?.content) {
              turnText += delta.content;
              // Separate consecutive narration turns so text doesn't run together.
              if (assistantText.length > 0 && turnText === delta.content) {
                emit({ type: "delta", text: "\n" });
                assistantText += "\n";
              }
              assistantText += delta.content;
              emit({ type: "delta", text: delta.content });
            }
            for (const tc of delta?.tool_calls ?? []) {
              const entry = toolCalls.get(tc.index) ?? { id: "", name: "", arguments: "" };
              if (tc.id) entry.id = tc.id;
              if (tc.function?.name) entry.name += tc.function.name;
              if (tc.function?.arguments) entry.arguments += tc.function.arguments;
              toolCalls.set(tc.index, entry);
            }
            if (choice.finish_reason) finishReason = choice.finish_reason;
          }

          if (finishReason !== "tool_calls" || toolCalls.size === 0) break;

          const calls = [...toolCalls.values()];
          openaiMessages.push({
            role: "assistant",
            content: turnText.length > 0 ? turnText : null,
            tool_calls: calls.map((c) => ({
              id: c.id,
              type: "function" as const,
              function: { name: c.name, arguments: c.arguments },
            })),
          });

          for (const call of calls) {
            let purpose: string | undefined;
            let sql: string | undefined;
            try {
              const args = JSON.parse(call.arguments) as { purpose?: string; sql?: string };
              purpose = args.purpose;
              sql = args.sql;
            } catch {
              // Non-JSON arguments — executor will report the error to the model.
            }
            emit({ type: "tool", name: call.name, purpose, sql });

            const execution = await executeTool(call.name, call.arguments);
            toolTrace.push(execution.trace);
            openaiMessages.push({
              role: "tool",
              tool_call_id: call.id,
              content: execution.result,
            });
          }
        }

        if (assistantText.trim().length === 0) {
          assistantText = "I couldn't produce an answer for that — please try rephrasing.";
          emit({ type: "delta", text: assistantText });
        }

        const saved = await db.chatMessage.create({
          data: {
            conversationId: convId,
            role: "ASSISTANT",
            content: assistantText,
            toolCalls: toolTrace.length > 0 ? JSON.parse(JSON.stringify(toolTrace)) : undefined,
          },
        });
        emit({ type: "done", messageId: saved.id });
      } catch (err) {
        console.error("[assistant] chat failed:", err);
        emit({
          type: "error",
          message:
            err instanceof Error && /api key/i.test(err.message)
              ? "OpenAI rejected the API key. Check OPENAI_API_KEY in .env."
              : "The assistant hit an error. Please try again.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
