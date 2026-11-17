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
import { verifyLicenseKey, type LicenseVerdict } from "../../server/license";
import {
  buildCompanionInstruction,
  DEFAULT_PERSONA,
  isPersonaId,
  buildMemoryNoteRequest,
  MAX_MEMORY_NOTE_LENGTH,
  tidyMemoryNote,
  type PersonaId,
} from "../../server/soulomPersona";

const SLIDING_WINDOW_SIZE = 20;
const MAX_TURN_LENGTH = 4000;
const MAX_REQUEST_BYTES = 160_000;
const DEFAULT_FREE_DAILY_MESSAGES = 20;
const FREE_DAILY_MEMORY_NOTES = 12;

type ChatMode = "chat" | "memory-note";

interface ChatRequest {
  mode: ChatMode;
  turns: ConversationTurn[];
  memoryNote: string;
  persona: PersonaId;
}

function parseChatRequest(body: unknown): ChatRequest | null {
  if (!isPlainObject(body) || !Array.isArray(body.messages)) return null;

  const mode: ChatMode = body.mode === "memory-note" ? "memory-note" : "chat";
  const memoryNote = typeof body.memoryNote === "string" ? body.memoryNote.slice(0, MAX_MEMORY_NOTE_LENGTH) : "";
  const persona = isPersonaId(body.persona) ? body.persona : DEFAULT_PERSONA;

  const turns: ConversationTurn[] = [];
  for (const candidate of body.messages.slice(-SLIDING_WINDOW_SIZE)) {
    if (!isPlainObject(candidate)) return null;
    const { role, text } = candidate;
    if ((role !== "user" && role !== "model") || typeof text !== "string") return null;
    const trimmedText = text.trim();
    if (!trimmedText || trimmedText.length > MAX_TURN_LENGTH) return null;
    turns.push({ role, text: trimmedText });
  }

  const preparedTurns = prepareTurnsForGemini(turns);
  if (preparedTurns.length === 0) return null;
  if (mode === "chat" && preparedTurns.at(-1)?.role !== "user") return null;

  return { mode, turns: preparedTurns, memoryNote, persona };
}

function describeSupporter(verdict: LicenseVerdict | null) {
  if (!verdict) return { active: false as const };
  if (verdict.valid) return { active: true as const, expiresAt: verdict.expiresAt };
  return { active: false as const, rejectedReason: verdict.reason };
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

  const quotaScope: QuotaScope = chatRequest.mode === "chat" ? "chat" : "memory-note";
  const dailyLimit =
    chatRequest.mode === "chat"
      ? readPositiveInteger(env.FREE_DAILY_MESSAGE_LIMIT, DEFAULT_FREE_DAILY_MESSAGES)
      : FREE_DAILY_MEMORY_NOTES;

  let clientFingerprint: string | null = null;
  let quota: QuotaSnapshot | null = null;

  if (!supporter.active) {
    clientFingerprint = await fingerprintClient(request);
    quota = await readDailyQuota(store, quotaScope, clientFingerprint, dailyLimit);
    if (quota.remaining <= 0) {
      return jsonResponse({ error: "quota_exceeded", quota, supporter }, 429);
    }
  }

  const generation =
    chatRequest.mode === "chat"
      ? {
          systemInstruction: buildCompanionInstruction(chatRequest.memoryNote, chatRequest.persona),
          turns: chatRequest.turns,
          temperature: 0.85,
          maxOutputTokens: 1024,
        }
      : {
          ...buildMemoryNoteRequest(chatRequest.memoryNote, chatRequest.turns),
          temperature: 0.2,
          maxOutputTokens: 512,
        };

  let reply: string;
  try {
    reply = await generateGeminiReply({
      apiKey: env.GEMINI_API_KEY.trim(), // trim() also strips a stray BOM (U+FEFF)
      models: resolveGeminiModels(env.GEMINI_MODEL),
      ...generation,
    });
  } catch (error) {
    // Logs only the model name and status, never conversation text.
    console.warn("gemini_failed", error instanceof Error ? error.message : "unknown");
    if (error instanceof GeminiRequestError && error.kind === "blocked") {
      return jsonResponse({ error: "reply_blocked" }, 422);
    }
    return jsonResponse({ error: "upstream_unavailable" }, 502);
  }

  if (quota && clientFingerprint) {
    quota = await consumeDailyQuota(store, quotaScope, clientFingerprint, quota);
  }

  const responseBody =
    chatRequest.mode === "chat"
      ? { reply, quota, supporter }
      : { memoryNote: tidyMemoryNote(reply), supporter };

  return jsonResponse(responseBody);
};
