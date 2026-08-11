/**
 * Minimal in-memory rate limiter for login attempts.
 *
 * Sufficient for the v1 single-instance deployment; swap the store for
 * Redis/Upstash when deploying to serverless (documented deployment risk).
 */

interface AttemptWindow {
  count: number;
  windowStartMs: number;
}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const attempts = new Map<string, AttemptWindow>();

function prune(now: number): void {
  for (const [key, entry] of attempts) {
    if (now - entry.windowStartMs > WINDOW_MS) attempts.delete(key);
  }
}

/** Returns true when the given key (e.g. normalized email) may attempt a login. */
export function allowLoginAttempt(key: string): boolean {
  const now = Date.now();
  if (attempts.size > 1000) prune(now);

  const entry = attempts.get(key);
  if (!entry || now - entry.windowStartMs > WINDOW_MS) {
    attempts.set(key, { count: 1, windowStartMs: now });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_ATTEMPTS;
}

/** Clears the counter after a successful login. */
export function resetLoginAttempts(key: string): void {
  attempts.delete(key);
}
