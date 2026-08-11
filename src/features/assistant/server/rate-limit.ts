/**
 * Per-user message rate limit for the assistant, mirroring the in-memory
 * login limiter (sufficient for the v1 single-instance deployment).
 */

interface Window {
  count: number;
  windowStartMs: number;
}

const WINDOW_MS = 5 * 60 * 1000;
const MAX_MESSAGES = 30;

const windows = new Map<string, Window>();

export function allowChatMessage(userId: string): boolean {
  const now = Date.now();
  if (windows.size > 1000) {
    for (const [key, entry] of windows) {
      if (now - entry.windowStartMs > WINDOW_MS) windows.delete(key);
    }
  }
  const entry = windows.get(userId);
  if (!entry || now - entry.windowStartMs > WINDOW_MS) {
    windows.set(userId, { count: 1, windowStartMs: now });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_MESSAGES;
}
