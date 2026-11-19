import { consumeDailyQuota, readDailyQuota, type QuotaScope, type QuotaSnapshot } from "../../server/dailyQuota";
import { readPositiveInteger, type SoulomEnv } from "../../server/env";
import {
  generateGeminiReply,
  GeminiRequestError,
  prepareTurnsForGemini,
  resolveGeminiModels,
  type ConversationTurn,
} from "../../server/geminiClient";
import { fingerprintClient, isPlainObject, jsonResponse, readJsonBody } from "../../server/http";
import { resolveStore } from "../../server/keyValueStore";
import { recordUpstreamFailure } from "../../server/serviceHealth";
import { DEFAULT_LANGUAGE, isLanguage, type Language } from "../../shared/personaIds";
import { verifyLicenseKey, type LicenseVerdict } from "../../server/license";
import {
  buildCompanionInstruction,
  buildMemoryNoteRequest,
  DEFAULT_PERSONA,
  isNudgeKind,
  isPersonaId,
  MAX_MEMORY_NOTE_LENGTH,
  NUDGE_PLACEHOLDER_TURN,
  resolveTimeZone,
  tidyMemoryNote,
  type NudgeContext,
  type PersonaId,
} from "../../server/soulomPersona";

const SLIDING_WINDOW_SIZE = 20;
const MAX_TURN_LENGTH = 4000;
const MAX_REQUEST_BYTES = 160_000;
const DEFAULT_FREE_DAILY_MESSAGES = 20;
const FREE_DAILY_MEMORY_NOTES = 12;
// Companion-initiated check-ins have their own small allowance so they never eat the user's chat quota.
const FREE_DAILY_NUDGES = 6;
const MAX_AWAY_MINUTES = 60 * 24 * 60;

type ChatMode = "chat" | "memory-note" | "nudge";

interface ChatRequest {
  mode: ChatMode;
  turns: ConversationTurn[];
  memoryNote: string;
  persona: PersonaId;
  language: Language;
  timeZone: string;
  nudge?: NudgeContext;
}

function readMode(value: unknown): ChatMode {
  return value === "memory-note" || value === "nudge" ? value : "chat";
}

function parseChatRequest(body: unknown): ChatRequest | null {
  if (!isPlainObject(body) || !Array.isArray(body.messages)) return null;

  const mode = readMode(body.mode);
  const memoryNote = typeof body.memoryNote === "string" ? body.memoryNote.slice(0, MAX_MEMORY_NOTE_LENGTH) : "";
  const persona = isPersonaId(body.persona) ? body.persona : DEFAULT_PERSONA;
  const language = isLanguage(body.language) ? body.language : DEFAULT_LANGUAGE;
  const timeZone = resolveTimeZone(body.timeZone);

  const turns: ConversationTurn[] = [];
  for (const candidate of body.messages.slice(-SLIDING_WINDOW_SIZE)) {
    if (!isPlainObject(candidate)) return null;
    const { role, text } = candidate;
    if ((role !== "user" && role !== "model") || typeof text !== "string") return null;
    const trimmedText = text.trim();
    if (!trimmedText || trimmedText.length > MAX_TURN_LENGTH) return null;
    turns.push({ role, text: trimmedText });
  }

  if (mode === "nudge") {
    if (!isNudgeKind(body.nudge)) return null;
    // A check-in needs something to refer back to: earlier chat or a memory note.
    if (turns.length === 0 && !memoryNote.trim()) return null;
    const preparedTurns = prepareTurnsForGemini([...turns, { role: "user", text: NUDGE_PLACEHOLDER_TURN }]);
    const awayMinutes =
      typeof body.awayMinutes === "number" && Number.isFinite(body.awayMinutes)
        ? Math.min(Math.max(Math.round(body.awayMinutes), 0), MAX_AWAY_MINUTES)
        : 0;
    return { mode, turns: preparedTurns, memoryNote, persona, language, timeZone, nudge: { kind: body.nudge, awayMinutes } };
  }

  const preparedTurns = prepareTurnsForGemini(turns);
  if (preparedTurns.length === 0) return null;
  if (mode === "chat" && preparedTurns.at(-1)?.role !== "user") return null;

  return { mode, turns: preparedTurns, memoryNote, persona, language, timeZone };
}

function describeSupporter(verdict: LicenseVerdict | null) {
  if (!verdict) return { active: false as const };
  if (verdict.valid) return { active: true as const, expiresAt: verdict.expiresAt };
  return { active: false as const, rejectedReason: verdict.reason };
}

function quotaFor(mode: ChatMode, env: SoulomEnv): { scope: QuotaScope; limit: number } {
  if (mode === "chat") {
    return { scope: "chat", limit: readPositiveInteger(env.FREE_DAILY_MESSAGE_LIMIT, DEFAULT_FREE_DAILY_MESSAGES) };
  }
  if (mode === "nudge") return { scope: "nudge", limit: FREE_DAILY_NUDGES };
  return { scope: "memory-note", limit: FREE_DAILY_MEMORY_NOTES };
}

function buildGeneration(chatRequest: ChatRequest) {
  if (chatRequest.mode === "memory-note") {
    return {
      ...buildMemoryNoteRequest(chatRequest.memoryNote, chatRequest.turns),
      temperature: 0.2,
      maxOutputTokens: 512,
    };
  }
  return {
    systemInstruction: buildCompanionInstruction(
      chatRequest.memoryNote,
      chatRequest.persona,
      chatRequest.language,
      chatRequest.nudge,
      chatRequest.timeZone,
    ),
    turns: chatRequest.turns,
    temperature: chatRequest.mode === "nudge" ? 0.9 : 0.85,
    maxOutputTokens: chatRequest.mode === "nudge" ? 256 : 1024,
  };
}

export const onRequestPost: PagesFunction<SoulomEnv> = async ({ request, env }) => {
  if (!env.GEMINI_API_KEY) {
    return jsonResponse({ error: "server_not_configured" }, 503);
  }

  const chatRequest = parseChatRequest(await readJsonBody(request, MAX_REQUEST_BYTES));
  if (!chatRequest) {
    return jsonResponse({ error: "invalid_request" }, 400);
  }

  const store = resolveStore(env);
  const presentedLicense = request.headers.get("X-License-Key")?.trim();
  const licenseVerdict = presentedLicense ? await verifyLicenseKey(presentedLicense, env, store) : null;
  const supporter = describeSupporter(licenseVerdict);

  const { scope: quotaScope, limit: dailyLimit } = quotaFor(chatRequest.mode, env);

  let clientFingerprint: string | null = null;
  let quota: QuotaSnapshot | null = null;

  if (!supporter.active) {
    clientFingerprint = await fingerprintClient(request);
    quota = await readDailyQuota(store, quotaScope, clientFingerprint, dailyLimit);
    if (quota.remaining <= 0) {
      return jsonResponse({ error: "quota_exceeded", quota, supporter }, 429);
    }
  }

  let reply: string;
  try {
    reply = await generateGeminiReply({
      apiKey: env.GEMINI_API_KEY.trim(), // trim() also strips a stray BOM (U+FEFF)
      models: resolveGeminiModels(env.GEMINI_MODEL),
      ...buildGeneration(chatRequest),
    });
  } catch (error) {
    // Logs only the model name and status, never conversation text.
    console.warn("gemini_failed", error instanceof Error ? error.message : "unknown");
    if (error instanceof GeminiRequestError && error.kind === "blocked") {
      return jsonResponse({ error: "reply_blocked" }, 422);
    }
    await recordUpstreamFailure(store);
    return jsonResponse({ error: "upstream_unavailable" }, 502);
  }

  if (quota && clientFingerprint) {
    try {
      quota = await consumeDailyQuota(store, quotaScope, clientFingerprint, quota);
    } catch {
      // The reply is already written; a failed counter write (e.g. KV daily write limit) must not lose it.
      quota = { ...quota, used: quota.used + 1, remaining: Math.max(0, quota.remaining - 1) };
    }
  }

  if (chatRequest.mode === "memory-note") return jsonResponse({ memoryNote: tidyMemoryNote(reply), supporter });
  if (chatRequest.mode === "nudge") return jsonResponse({ reply, supporter });
  return jsonResponse({ reply, quota, supporter });
};
