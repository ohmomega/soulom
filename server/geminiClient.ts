// Fast, non-thinking models first; the next one is tried when a model is busy (429/5xx) or times out.
// gemini-2.5-flash is closed to new API keys, so it is no longer used.
export const DEFAULT_GEMINI_MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
const ATTEMPT_TIMEOUT_MS = 25_000;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

function endpointFor(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
}

/** GEMINI_MODEL env may name one model or a comma-separated fallback list. */
export function resolveGeminiModels(rawValue: string | undefined): string[] {
  const configured = (rawValue ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  return configured.length > 0 ? configured : DEFAULT_GEMINI_MODELS;
}

export type ConversationRole = "user" | "model";

export interface ConversationTurn {
  role: ConversationRole;
  text: string;
}

export interface GeminiGenerationOptions {
  apiKey: string;
  systemInstruction: string;
  turns: ConversationTurn[];
  temperature: number;
  maxOutputTokens: number;
  models?: string[];
}

export class GeminiRequestError extends Error {
  constructor(
    message: string,
    readonly kind: "upstream" | "blocked" | "empty",
    readonly upstreamStatus?: number,
  ) {
    super(message);
    this.name = "GeminiRequestError";
  }
}

interface GeminiPart {
  text?: string;
  thought?: boolean;
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: GeminiPart[] }; finishReason?: string }>;
  promptFeedback?: { blockReason?: string };
}

export function prepareTurnsForGemini(turns: ConversationTurn[]): ConversationTurn[] {
  const firstUserIndex = turns.findIndex((turn) => turn.role === "user");
  if (firstUserIndex === -1) return [];

  return turns.slice(firstUserIndex).reduce<ConversationTurn[]>((merged, turn) => {
    const previous = merged.at(-1);
    if (previous && previous.role === turn.role) {
      previous.text = `${previous.text}\n\n${turn.text}`;
    } else {
      merged.push({ role: turn.role, text: turn.text });
    }
    return merged;
  }, []);
}

export async function generateGeminiReply(options: GeminiGenerationOptions): Promise<string> {
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: options.systemInstruction }] },
    contents: options.turns.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
    generationConfig: {
      temperature: options.temperature,
      maxOutputTokens: options.maxOutputTokens,
      // Gemini 3.x ignores thinkingBudget; "minimal" keeps lite models from spending output tokens on thoughts.
      thinkingConfig: { thinkingLevel: "minimal" },
    },
  });

  const models = options.models && options.models.length > 0 ? options.models : DEFAULT_GEMINI_MODELS;
  let lastError: GeminiRequestError | undefined;

  for (const model of models) {
    let response: Response;
    try {
      response = await fetch(endpointFor(model), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": options.apiKey,
        },
        body,
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      });
    } catch {
      lastError = new GeminiRequestError(`Gemini ${model} timed out or failed`, "upstream");
      continue;
    }

    if (!response.ok) {
      const detail = await response
        .json()
        .then((data) => {
          const error = (data as { error?: { status?: string; message?: string } }).error;
          return error ? ` ${error.status ?? ""} ${(error.message ?? "").slice(0, 160)}` : "";
        })
        .catch(() => "");
      lastError = new GeminiRequestError(
        `Gemini ${model} responded with ${response.status}${detail}`,
        "upstream",
        response.status,
      );
      if (RETRYABLE_STATUSES.has(response.status)) continue;
      throw lastError;
    }

    return readReply((await response.json()) as GeminiResponse);
  }

  throw lastError ?? new GeminiRequestError("No Gemini model configured", "upstream");
}

function readReply(payload: GeminiResponse): string {
  if (payload.promptFeedback?.blockReason) {
    throw new GeminiRequestError(`Prompt blocked: ${payload.promptFeedback.blockReason}`, "blocked");
  }

  const candidate = payload.candidates?.[0];
  const replyText = (candidate?.content?.parts ?? [])
    .filter((part) => !part.thought && typeof part.text === "string")
    .map((part) => part.text)
    .join("")
    .trim();

  if (!replyText) {
    const isBlocked = candidate?.finishReason === "SAFETY" || candidate?.finishReason === "PROHIBITED_CONTENT";
    throw new GeminiRequestError("Gemini returned no text", isBlocked ? "blocked" : "empty");
  }
  return replyText;
}
