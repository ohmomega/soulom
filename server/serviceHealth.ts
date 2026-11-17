import type { KeyValueStore } from "./keyValueStore";

// When Gemini fails for a request (after trying every fallback model), we note the time.
// /api/status reports "degraded" for a few minutes after that, so the app can warn people.
// Writes are throttled because Cloudflare KV's free tier allows only ~1,000 writes a day.
const FAILURE_KEY = "health:upstreamFailedAt";
const DEGRADED_WINDOW_MS = 3 * 60 * 1000;
const WRITE_THROTTLE_MS = 60 * 1000;
const FAILURE_TTL_SECONDS = 10 * 60;

export type ServiceStatus = "ok" | "degraded" | "down";

export async function recordUpstreamFailure(store: KeyValueStore): Promise<void> {
  try {
    const previous = Number((await store.get(FAILURE_KEY)) ?? 0);
    if (Date.now() - previous < WRITE_THROTTLE_MS) return;
    await store.put(FAILURE_KEY, String(Date.now()), { expirationTtl: FAILURE_TTL_SECONDS });
  } catch {
    // Health bookkeeping must never turn into a user-facing error.
  }
}

export async function readServiceStatus(store: KeyValueStore, isConfigured: boolean): Promise<ServiceStatus> {
  if (!isConfigured) return "down";
  try {
    const failedAt = Number((await store.get(FAILURE_KEY)) ?? 0);
    return Date.now() - failedAt < DEGRADED_WINDOW_MS ? "degraded" : "ok";
  } catch {
    return "degraded";
  }
}
