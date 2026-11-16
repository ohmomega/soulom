import type { ChatMessage, StoredLicense } from "../types/chat";
import { isChatMessageList, isMemoryNote, isRecord, isValidLicenseKey } from "./schema";

const STORAGE_KEYS = {
  messages: "soulom.messages.v1",
  memoryNote: "soulom.memoryNote.v1",
  memoryNoteCursor: "soulom.memoryNoteCursor.v1",
  license: "soulom.license.v1",
} as const;

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string | null): boolean {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function readJson(key: string): unknown {
  const raw = readRaw(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const localVault = {
  loadMessages(): ChatMessage[] {
    const stored = readJson(STORAGE_KEYS.messages);
    return isChatMessageList(stored) ? stored : [];
  },
  saveMessages(messages: ChatMessage[]): boolean {
    return writeRaw(STORAGE_KEYS.messages, JSON.stringify(messages));
  },

  loadMemoryNote(): string {
    const stored = readRaw(STORAGE_KEYS.memoryNote);
    return isMemoryNote(stored) ? stored : "";
  },
  saveMemoryNote(note: string): void {
    writeRaw(STORAGE_KEYS.memoryNote, note || null);
  },

  loadMemoryNoteCursor(): number {
    const cursor = Number.parseInt(readRaw(STORAGE_KEYS.memoryNoteCursor) ?? "0", 10);
    return Number.isFinite(cursor) && cursor >= 0 ? cursor : 0;
  },
  saveMemoryNoteCursor(cursor: number): void {
    writeRaw(STORAGE_KEYS.memoryNoteCursor, String(cursor));
  },

  loadLicense(): StoredLicense | null {
    const stored = readJson(STORAGE_KEYS.license);
    if (!isRecord(stored) || !isValidLicenseKey(stored.key)) return null;
    const expiresAt = typeof stored.expiresAt === "string" ? stored.expiresAt : null;
    return { key: stored.key, expiresAt };
  },
  saveLicense(license: StoredLicense | null): void {
    writeRaw(STORAGE_KEYS.license, license ? JSON.stringify(license) : null);
  },

  clearConversation(): void {
    writeRaw(STORAGE_KEYS.messages, null);
    writeRaw(STORAGE_KEYS.memoryNote, null);
    writeRaw(STORAGE_KEYS.memoryNoteCursor, null);
  },
};
