import type { ChatMessage, QuotaStatus } from "../types/chat";
import { isRecord } from "./schema";

export const SLIDING_WINDOW_SIZE = 20;

export interface SupporterState {
  active: boolean;
  expiresAt?: string | null;
  rejectedReason?: string;
}

export type ReplyOutcome =
  | { kind: "reply"; text: string; quota: QuotaStatus | null; supporter: SupporterState }
  | { kind: "quota-exceeded"; supporter: SupporterState }
  | { kind: "failed"; reason: "blocked" | "offline" | "unavailable" | "not-configured" };

function toApiTurns(messages: ChatMessage[]) {
  return messages.slice(-SLIDING_WINDOW_SIZE).map(({ role, text }) => ({ role, text }));
}

function buildHeaders(licenseKey: string | null): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (licenseKey) headers["X-License-Key"] = licenseKey;
  return headers;
}

function readSupporter(payload: Record<string, unknown>): SupporterState {
  const supporter = payload.supporter;
  if (!isRecord(supporter)) return { active: false };
  return {
    active: supporter.active === true,
    expiresAt: typeof supporter.expiresAt === "string" ? supporter.expiresAt : null,
    rejectedReason: typeof supporter.rejectedReason === "string" ? supporter.rejectedReason : undefined,
  };
}

function readQuota(payload: Record<string, unknown>): QuotaStatus | null {
  const quota = payload.quota;
  if (!isRecord(quota) || typeof quota.limit !== "number" || typeof quota.remaining !== "number") return null;
  return { limit: quota.limit, remaining: quota.remaining };
}

async function postJson(path: string, body: unknown, licenseKey: string | null, signal?: AbortSignal) {
  const response = await fetch(path, {
    method: "POST",
    headers: buildHeaders(licenseKey),
    body: JSON.stringify(body),
    signal,
  });
  const payload: unknown = await response.json().catch(() => null);
  return { status: response.status, payload: isRecord(payload) ? payload : {} };
}

export async function requestCompanionReply(
  messages: ChatMessage[],
  memoryNote: string,
  licenseKey: string | null,
  signal?: AbortSignal,
): Promise<ReplyOutcome> {
  let result: Awaited<ReturnType<typeof postJson>>;
  try {
    result = await postJson("/api/chat", { mode: "chat", messages: toApiTurns(messages), memoryNote }, licenseKey, signal);
  } catch {
    return { kind: "failed", reason: "offline" };
  }

  const { status, payload } = result;
  if (status === 200 && typeof payload.reply === "string") {
    return { kind: "reply", text: payload.reply, quota: readQuota(payload), supporter: readSupporter(payload) };
  }
  if (status === 429 && payload.error === "quota_exceeded") {
    return { kind: "quota-exceeded", supporter: readSupporter(payload) };
  }
  if (status === 422) return { kind: "failed", reason: "blocked" };
  if (status === 503) return { kind: "failed", reason: "not-configured" };
  return { kind: "failed", reason: "unavailable" };
}

export async function requestMemoryNote(
  messages: ChatMessage[],
  previousNote: string,
  licenseKey: string | null,
): Promise<string | null> {
  try {
    const { status, payload } = await postJson(
      "/api/chat",
      { mode: "memory-note", messages: toApiTurns(messages), memoryNote: previousNote },
      licenseKey,
    );
    return status === 200 && typeof payload.memoryNote === "string" ? payload.memoryNote : null;
  } catch {
    return null;
  }
}

export type LicenseCheckOutcome =
  | { kind: "valid"; licenseKey: string; expiresAt: string | null }
  | { kind: "invalid"; reason: string }
  | { kind: "failed" };

export async function checkLicense(licenseKey: string): Promise<LicenseCheckOutcome> {
  try {
    const { status, payload } = await postJson("/api/license", { licenseKey }, null);
    if (status === 429) return { kind: "invalid", reason: "too_many_attempts" };
    if (status !== 200) return { kind: "failed" };
    if (payload.valid === true && typeof payload.licenseKey === "string") {
      return {
        kind: "valid",
        licenseKey: payload.licenseKey,
        expiresAt: typeof payload.expiresAt === "string" ? payload.expiresAt : null,
      };
    }
    return { kind: "invalid", reason: typeof payload.reason === "string" ? payload.reason : "unknown" };
  } catch {
    return { kind: "failed" };
  }
}

export type SlipOutcome =
  | { kind: "issued"; licenseKey: string; expiresAt: string }
  | { kind: "rejected"; code: string; minimumAmount?: number };

export async function submitPaymentSlip(slipImage: File): Promise<SlipOutcome> {
  const formData = new FormData();
  formData.append("slip", slipImage);
  try {
    const response = await fetch("/api/verify-slip", { method: "POST", body: formData });
    const payload: unknown = await response.json().catch(() => null);
    if (!isRecord(payload)) return { kind: "rejected", code: "slip_service_unavailable" };
    if (response.ok && typeof payload.licenseKey === "string" && typeof payload.expiresAt === "string") {
      return { kind: "issued", licenseKey: payload.licenseKey, expiresAt: payload.expiresAt };
    }
    return {
      kind: "rejected",
      code: typeof payload.error === "string" ? payload.error : "slip_service_unavailable",
      minimumAmount: typeof payload.minimumAmount === "number" ? payload.minimumAmount : undefined,
    };
  } catch {
    return { kind: "rejected", code: "offline" };
  }
}
