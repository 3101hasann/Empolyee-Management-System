/**
 * App-side validation for model-written SQL. Defense in depth only — the real
 * wall is the dedicated MySQL user (DATABASE_URL_READONLY) that holds SELECT
 * on the v_* views and nothing else. See scripts/assistant-readonly.sql.
 */

const DEFAULT_LIMIT = 100;

// Statement kinds and functions a read-only analytics query never needs.
const FORBIDDEN =
  /\b(insert|update|delete|drop|alter|create|grant|revoke|truncate|replace|rename|call|lock|unlock|handler|prepare|execute|deallocate|kill|shutdown|outfile|dumpfile|infile|load_file|sleep|benchmark)\b/i;

export type GuardResult = { ok: true; sql: string } | { ok: false; error: string };

export function guardSql(raw: string): GuardResult {
  let sql = raw.trim().replace(/;+\s*$/, "");

  if (sql.length === 0) return { ok: false, error: "Empty query." };
  if (sql.includes(";")) {
    return { ok: false, error: "Only a single statement is allowed." };
  }
  if (!/^(select|with)\b/i.test(sql)) {
    return { ok: false, error: "Only SELECT queries are allowed." };
  }
  const forbidden = sql.match(FORBIDDEN);
  if (forbidden) {
    return { ok: false, error: `Forbidden keyword in query: ${forbidden[0]}` };
  }
  // Keep result sets bounded; rows are additionally capped after fetch.
  if (!/\blimit\s+\d+/i.test(sql)) {
    sql = `${sql} LIMIT ${DEFAULT_LIMIT}`;
  }
  return { ok: true, sql };
}

/** Makes raw MySQL rows JSON-safe and token-cheap (BigInt, Date, Decimal). */
export function sanitizeRows(rows: unknown[]): unknown[] {
  return rows.map((row) => {
    if (row === null || typeof row !== "object") return row;
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      out[key] = sanitizeValue(value);
    }
    return out;
  });
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "bigint") return Number(value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (value !== null && typeof value === "object") {
    // Prisma Decimal and friends stringify to their numeric form.
    const asNumber = Number(String(value));
    return Number.isNaN(asNumber) ? String(value) : asNumber;
  }
  return value;
}
