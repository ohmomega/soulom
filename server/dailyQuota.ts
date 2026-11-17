import type { KeyValueStore } from "./keyValueStore";

const BANGKOK_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;
const QUOTA_RECORD_TTL_SECONDS = 2 * 24 * 60 * 60;

export type QuotaScope = "chat" | "memory-note" | "nudge" | "license-check" | "slip";

export interface QuotaSnapshot {
  limit: number;
  used: number;
  remaining: number;
}

export function bangkokDateStamp(timestamp = Date.now()): string {
  return new Date(timestamp + BANGKOK_UTC_OFFSET_MS).toISOString().slice(0, 10);
}

function quotaKey(scope: QuotaScope, clientFingerprint: string): string {
  return `quota:${scope}:${bangkokDateStamp()}:${clientFingerprint}`;
}

export async function readDailyQuota(
  store: KeyValueStore,
  scope: QuotaScope,
  clientFingerprint: string,
  limit: number,
): Promise<QuotaSnapshot> {
  const storedCount = Number.parseInt((await store.get(quotaKey(scope, clientFingerprint))) ?? "0", 10);
  const used = Number.isFinite(storedCount) ? storedCount : 0;
  return { limit, used, remaining: Math.max(0, limit - used) };
}

export async function consumeDailyQuota(
  store: KeyValueStore,
  scope: QuotaScope,
  clientFingerprint: string,
  snapshot: QuotaSnapshot,
): Promise<QuotaSnapshot> {
  const used = snapshot.used + 1;
  await store.put(quotaKey(scope, clientFingerprint), String(used), {
    expirationTtl: QUOTA_RECORD_TTL_SECONDS,
  });
  return { limit: snapshot.limit, used, remaining: Math.max(0, snapshot.limit - used) };
}
