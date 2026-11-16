import type { SoulomEnv } from "./env";

export interface KeyValueStore {
  readonly isPersistent: boolean;
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

const KV_MINIMUM_TTL_SECONDS = 60;

interface InMemoryEntry {
  value: string;
  expiresAt: number | null;
}

const inMemoryEntries = new Map<string, InMemoryEntry>();

const inMemoryStore: KeyValueStore = {
  isPersistent: false,
  async get(key) {
    const entry = inMemoryEntries.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      inMemoryEntries.delete(key);
      return null;
    }
    return entry.value;
  },
  async put(key, value, options) {
    const expiresAt = options?.expirationTtl ? Date.now() + options.expirationTtl * 1000 : null;
    inMemoryEntries.set(key, { value, expiresAt });
  },
};

function wrapKvNamespace(namespace: KVNamespace): KeyValueStore {
  return {
    isPersistent: true,
    get: (key) => namespace.get(key),
    put: (key, value, options) => {
      const expirationTtl = options?.expirationTtl
        ? Math.max(KV_MINIMUM_TTL_SECONDS, Math.ceil(options.expirationTtl))
        : undefined;
      return namespace.put(key, value, expirationTtl ? { expirationTtl } : undefined);
    },
  };
}

export function resolveStore(env: SoulomEnv): KeyValueStore {
  return env.SOULOM_KV ? wrapKvNamespace(env.SOULOM_KV) : inMemoryStore;
}

export async function readJsonValue<T>(store: KeyValueStore, key: string): Promise<T | null> {
  const raw = await store.get(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
