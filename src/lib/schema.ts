import type { ChatMessage } from "../types/chat";

export const LIMITS = {
  messageTextLength: 20_000,
  messageIdLength: 64,
  messageCount: 20_000,
  memoryNoteLength: 4_000,
} as const;

const LICENSE_KEY_PATTERN = /^[A-Za-z0-9-]{8,128}$/;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function hasExactKeys(record: Record<string, unknown>, allowedKeys: readonly string[]): boolean {
  const keys = Object.keys(record);
  return keys.length === allowedKeys.length && allowedKeys.every((key) => Object.hasOwn(record, key));
}

export function isChatMessage(value: unknown): value is ChatMessage {
  if (!isRecord(value) || !hasExactKeys(value, ["id", "role", "text", "createdAt"])) return false;
  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    value.id.length <= LIMITS.messageIdLength &&
    (value.role === "user" || value.role === "model") &&
    typeof value.text === "string" &&
    value.text.length <= LIMITS.messageTextLength &&
    typeof value.createdAt === "number" &&
    Number.isFinite(value.createdAt) &&
    value.createdAt > 0
  );
}

export function isChatMessageList(value: unknown): value is ChatMessage[] {
  return Array.isArray(value) && value.length <= LIMITS.messageCount && value.every(isChatMessage);
}

export function isValidLicenseKey(value: unknown): value is string {
  return typeof value === "string" && LICENSE_KEY_PATTERN.test(value);
}

export function isMemoryNote(value: unknown): value is string {
  return typeof value === "string" && value.length <= LIMITS.memoryNoteLength;
}
