import type OpenAI from "openai";
import { z } from "zod";

import { db } from "@/lib/db";

import { getReadonlyDb } from "./db-readonly";
import { guardSql, sanitizeRows } from "./sql-guard";

const MAX_ROWS = 100;
const MAX_RESULT_CHARS = 15_000;
const QUERY_TIMEOUT_MS = 8_000;

export const toolDefinitions: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "query_database",
      description:
        "Run a single read-only MySQL SELECT over the v_* views described in the system prompt. Use it for any question about batches, internees, tenures, or lookups. Returns JSON rows.",
      parameters: {
        type: "object",
        properties: {
          purpose: {
            type: "string",
            description:
              "One short sentence describing what this query answers, shown to the admin in the audit trail.",
          },
          sql: {
            type: "string",
            description:
              "A single MySQL SELECT (or WITH...SELECT) statement over the v_* views only. No semicolons, no writes.",
          },
        },
        required: ["purpose", "sql"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_overview",
      description:
        "Headline numbers in one call: batch counts by status, active batches with intern counts, total internees, and internees joined this month. Prefer this for broad 'how are things looking' questions.",
      parameters: { type: "object", properties: {} },
    },
  },
];

const queryArgsSchema = z.object({
  purpose: z.string().min(1).max(300),
  sql: z.string().min(1).max(4000),
});

/** Trace entry persisted on the assistant message and shown in the UI. */
export interface ToolTraceEntry {
  name: string;
  purpose?: string;
  sql?: string;
  rowCount?: number;
  error?: string;
}

export interface ToolExecution {
  /** JSON string fed back to the model. */
  result: string;
  trace: ToolTraceEntry;
}

export async function executeTool(name: string, rawArgs: string): Promise<ToolExecution> {
  try {
    if (name === "query_database") {
      return await runQuery(rawArgs);
    }
    if (name === "get_overview") {
      return await runOverview();
    }
    return {
      result: JSON.stringify({ error: `Unknown tool: ${name}` }),
      trace: { name, error: `Unknown tool: ${name}` },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tool execution failed";
    return {
      result: JSON.stringify({ error: message }),
      trace: { name, error: message },
    };
  }
}

async function runQuery(rawArgs: string): Promise<ToolExecution> {
  const parsed = queryArgsSchema.safeParse(JSON.parse(rawArgs));
  if (!parsed.success) {
    const error = "Invalid tool arguments: provide { purpose, sql }.";
    return { result: JSON.stringify({ error }), trace: { name: "query_database", error } };
  }
  const { purpose, sql } = parsed.data;

  const guarded = guardSql(sql);
  if (!guarded.ok) {
    return {
      result: JSON.stringify({ error: guarded.error }),
      trace: { name: "query_database", purpose, sql, error: guarded.error },
    };
  }

  try {
    const rows = await withTimeout(execReadonly(guarded.sql), QUERY_TIMEOUT_MS);
    const capped = rows.slice(0, MAX_ROWS);
    const sanitized = sanitizeRows(capped);

    let payload = JSON.stringify({ rowCount: rows.length, rows: sanitized });
    if (payload.length > MAX_RESULT_CHARS) {
      // Shrink until it fits — protects the context window from huge results.
      let keep = sanitized.length;
      while (payload.length > MAX_RESULT_CHARS && keep > 1) {
        keep = Math.floor(keep / 2);
        payload = JSON.stringify({
          rowCount: rows.length,
          truncatedTo: keep,
          rows: sanitized.slice(0, keep),
        });
      }
    }
    return {
      result: payload,
      trace: { name: "query_database", purpose, sql: guarded.sql, rowCount: rows.length },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Query failed";
    return {
      result: JSON.stringify({
        error: message,
        hint: "Fix the SQL (check view and column names in the schema) and try again.",
      }),
      trace: { name: "query_database", purpose, sql: guarded.sql, error: message },
    };
  }
}

async function execReadonly(sql: string): Promise<unknown[]> {
  const ro = getReadonlyDb();
  try {
    // Pin one connection so the execution-time cap applies to our SELECT.
    const [, rows] = await ro.$transaction([
      ro.$executeRawUnsafe(`SET SESSION MAX_EXECUTION_TIME=${QUERY_TIMEOUT_MS}`),
      ro.$queryRawUnsafe(sql),
    ]);
    return rows as unknown[];
  } catch (err) {
    // MariaDB servers don't know MAX_EXECUTION_TIME — retry without it.
    if (err instanceof Error && /MAX_EXECUTION_TIME/i.test(err.message)) {
      return (await ro.$queryRawUnsafe(sql)) as unknown[];
    }
    throw err;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Query exceeded ${ms / 1000}s timeout`)), ms + 500);
    }),
  ]);
}

async function runOverview(): Promise<ToolExecution> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [byStatus, totalInternees, joinedThisMonth, activeBatches] = await Promise.all([
    db.batch.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    db.internee.count({ where: { deletedAt: null } }),
    db.internee.count({ where: { deletedAt: null, createdAt: { gte: monthStart } } }),
    db.batch.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: {
        name: true,
        endDate: true,
        _count: { select: { tenures: { where: { deletedAt: null } } } },
      },
      orderBy: { endDate: "asc" },
    }),
  ]);

  const overview = {
    batches: Object.fromEntries(byStatus.map((b) => [b.status, b._count._all])),
    totalInternees,
    interneesJoinedThisMonth: joinedThisMonth,
    activeBatches: activeBatches.map((b) => ({
      name: b.name,
      endDate: b.endDate.toISOString().slice(0, 10),
      internees: b._count.tenures,
    })),
  };

  return {
    result: JSON.stringify(overview),
    trace: { name: "get_overview" },
  };
}
