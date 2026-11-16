const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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
  const response = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": options.apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: options.systemInstruction }] },
      contents: options.turns.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxOutputTokens,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!response.ok) {
    throw new GeminiRequestError(`Gemini responded with ${response.status}`, "upstream", response.status);
  }

  const payload = (await response.json()) as GeminiResponse;
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
