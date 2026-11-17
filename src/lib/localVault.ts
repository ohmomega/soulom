import type { ChatMessage, StoredLicense } from "../types/chat";
import { isChatMessageList, isMemoryNote, isRecord, isValidLicenseKey } from "./schema";
import { DEFAULT_PERSONA, isPersonaId, type PersonaId } from "../config/personas";

const STORAGE_KEYS = {
  messages: "soulom.messages.v1",
  memoryNote: "soulom.memoryNote.v1",
  memoryNoteCursor: "soulom.memoryNoteCursor.v1",
  license: "soulom.license.v1",
  persona: "soulom.persona.v1",
  nudgesEnabled: "soulom.nudges.v1",
  lastNudgeId: "soulom.lastNudge.v1",
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

  loadPersona(): PersonaId {
    const stored = readRaw(STORAGE_KEYS.persona);
    return isPersonaId(stored) ? stored : DEFAULT_PERSONA;
  },
  savePersona(persona: PersonaId): boolean {
    return writeRaw(STORAGE_KEYS.persona, persona);
  },

  loadNudgesEnabled(): boolean {
    return readRaw(STORAGE_KEYS.nudgesEnabled) !== "off";
  },
  saveNudgesEnabled(enabled: boolean): boolean {
    return writeRaw(STORAGE_KEYS.nudgesEnabled, enabled ? null : "off");
  },

  /** Id of the last message Soulom sent on its own, so it never nudges twice in a row. */
  loadLastNudgeId(): string | null {
    return readRaw(STORAGE_KEYS.lastNudgeId);
  },
  saveLastNudgeId(messageId: string | null): void {
    writeRaw(STORAGE_KEYS.lastNudgeId, messageId);
  },

  /** "Start over" wipes everything tied to this person, including their chosen persona and check-in setting. */
  clearConversation(): void {
    writeRaw(STORAGE_KEYS.messages, null);
    writeRaw(STORAGE_KEYS.memoryNote, null);
    writeRaw(STORAGE_KEYS.memoryNoteCursor, null);
    writeRaw(STORAGE_KEYS.persona, null);
    writeRaw(STORAGE_KEYS.nudgesEnabled, null);
    writeRaw(STORAGE_KEYS.lastNudgeId, null);
  },
};
