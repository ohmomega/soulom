import type { ChatMessage } from "../types/chat";
import { hasExactKeys, isChatMessageList, isMemoryNote, isRecord, isValidLicenseKey } from "./schema";

const FILE_FORMAT = "soulom";
const FILE_VERSION = 1;
const PBKDF2_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const MAX_HINT_LENGTH = 120;
export const MAX_SOULOM_FILE_BYTES = 15 * 1024 * 1024;

export interface MemorySnapshot {
  exportedAt: string;
  messages: ChatMessage[];
  memoryNote: string;
  licenseKey: string | null;
}

interface QuickSaveEnvelope {
  format: typeof FILE_FORMAT;
  version: typeof FILE_VERSION;
  mode: "quick";
  payload: string;
}

interface VaultLockEnvelope {
  format: typeof FILE_FORMAT;
  version: typeof FILE_VERSION;
  mode: "vault";
  hint: string;
  kdf: { name: "PBKDF2"; hash: "SHA-256"; iterations: number; salt: string };
  cipher: { name: "AES-GCM"; iv: string };
  payload: string;
}

export type SoulomEnvelope = QuickSaveEnvelope | VaultLockEnvelope;

export class SoulomFileError extends Error {
  constructor(readonly code: "unreadable" | "unsupported" | "corrupted" | "wrong-password" | "too-large") {
    super(code);
    this.name = "SoulomFileError";
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(encoded: string): Uint8Array<ArrayBuffer> {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function isBase64(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(value);
}

async function deriveVaultKey(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<CryptoKey> {
  const passwordKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function createQuickSave(snapshot: MemorySnapshot): Promise<string> {
  const envelope: QuickSaveEnvelope = {
    format: FILE_FORMAT,
    version: FILE_VERSION,
    mode: "quick",
    payload: bytesToBase64(new TextEncoder().encode(JSON.stringify(snapshot))),
  };
  return JSON.stringify(envelope);
}

export async function createVaultLock(snapshot: MemorySnapshot, password: string, hint: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveVaultKey(password, salt, PBKDF2_ITERATIONS);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(JSON.stringify(snapshot)),
  );

  const envelope: VaultLockEnvelope = {
    format: FILE_FORMAT,
    version: FILE_VERSION,
    mode: "vault",
    hint: hint.trim().slice(0, MAX_HINT_LENGTH),
    kdf: { name: "PBKDF2", hash: "SHA-256", iterations: PBKDF2_ITERATIONS, salt: bytesToBase64(salt) },
    cipher: { name: "AES-GCM", iv: bytesToBase64(iv) },
    payload: bytesToBase64(new Uint8Array(ciphertext)),
  };
  return JSON.stringify(envelope);
}

function isVaultKdf(value: unknown): value is VaultLockEnvelope["kdf"] {
  return (
    isRecord(value) &&
    hasExactKeys(value, ["name", "hash", "iterations", "salt"]) &&
    value.name === "PBKDF2" &&
    value.hash === "SHA-256" &&
    typeof value.iterations === "number" &&
    Number.isInteger(value.iterations) &&
    value.iterations >= 100_000 &&
    value.iterations <= 5_000_000 &&
    isBase64(value.salt)
  );
}

function isVaultCipher(value: unknown): value is VaultLockEnvelope["cipher"] {
  return isRecord(value) && hasExactKeys(value, ["name", "iv"]) && value.name === "AES-GCM" && isBase64(value.iv);
}

export function parseEnvelope(fileText: string): SoulomEnvelope {
  if (fileText.length > MAX_SOULOM_FILE_BYTES) throw new SoulomFileError("too-large");

  let parsed: unknown;
  try {
    parsed = JSON.parse(fileText);
  } catch {
    throw new SoulomFileError("unreadable");
  }

  if (!isRecord(parsed) || parsed.format !== FILE_FORMAT) throw new SoulomFileError("unreadable");
  if (parsed.version !== FILE_VERSION) throw new SoulomFileError("unsupported");

  if (parsed.mode === "quick" && hasExactKeys(parsed, ["format", "version", "mode", "payload"]) && isBase64(parsed.payload)) {
    return parsed as unknown as QuickSaveEnvelope;
  }

  if (
    parsed.mode === "vault" &&
    hasExactKeys(parsed, ["format", "version", "mode", "hint", "kdf", "cipher", "payload"]) &&
    typeof parsed.hint === "string" &&
    parsed.hint.length <= MAX_HINT_LENGTH &&
    isVaultKdf(parsed.kdf) &&
    isVaultCipher(parsed.cipher) &&
    isBase64(parsed.payload)
  ) {
    return parsed as unknown as VaultLockEnvelope;
  }

  throw new SoulomFileError("corrupted");
}

function validateSnapshot(candidate: unknown): MemorySnapshot {
  if (
    !isRecord(candidate) ||
    !hasExactKeys(candidate, ["exportedAt", "messages", "memoryNote", "licenseKey"]) ||
    typeof candidate.exportedAt !== "string" ||
    Number.isNaN(Date.parse(candidate.exportedAt)) ||
    !isChatMessageList(candidate.messages) ||
    !isMemoryNote(candidate.memoryNote) ||
    !(candidate.licenseKey === null || isValidLicenseKey(candidate.licenseKey))
  ) {
    throw new SoulomFileError("corrupted");
  }

  const seenIds = new Set<string>();
  for (const message of candidate.messages) {
    if (seenIds.has(message.id)) throw new SoulomFileError("corrupted");
    seenIds.add(message.id);
  }

  return {
    exportedAt: candidate.exportedAt,
    messages: candidate.messages.map(({ id, role, text, createdAt }) => ({ id, role, text, createdAt })),
    memoryNote: candidate.memoryNote,
    licenseKey: candidate.licenseKey,
  };
}

function parseSnapshotBytes(bytes: Uint8Array): MemorySnapshot {
  let decoded: unknown;
  try {
    decoded = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new SoulomFileError("corrupted");
  }
  return validateSnapshot(decoded);
}

export function openQuickSave(envelope: QuickSaveEnvelope): MemorySnapshot {
  return parseSnapshotBytes(base64ToBytes(envelope.payload));
}

export async function openVaultLock(envelope: VaultLockEnvelope, password: string): Promise<MemorySnapshot> {
  const key = await deriveVaultKey(password, base64ToBytes(envelope.kdf.salt), envelope.kdf.iterations);
  let plaintext: ArrayBuffer;
  try {
    plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(envelope.cipher.iv) },
      key,
      base64ToBytes(envelope.payload),
    );
  } catch {
    throw new SoulomFileError("wrong-password");
  }
  return parseSnapshotBytes(new Uint8Array(plaintext));
}

export function buildSoulomFileName(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
  return `soulom-${stamp}.soulom`;
}

export function downloadTextFile(fileName: string, contents: string): void {
  const blob = new Blob([contents], { type: "application/octet-stream" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
