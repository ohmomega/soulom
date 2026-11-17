// Single source of persona ids for both the app (src/) and the Pages Functions (server/).
export const PERSONA_IDS = ["friend", "kind", "polite"] as const;
export type PersonaId = (typeof PERSONA_IDS)[number];
export const DEFAULT_PERSONA: PersonaId = "friend";

export function isPersonaId(value: unknown): value is PersonaId {
  return typeof value === "string" && (PERSONA_IDS as readonly string[]).includes(value);
}

// Why the companion speaks first: the user came back after a while, or went quiet mid-chat.
export const NUDGE_KINDS = ["return", "silence"] as const;
export type NudgeKind = (typeof NUDGE_KINDS)[number];

export function isNudgeKind(value: unknown): value is NudgeKind {
  return typeof value === "string" && (NUDGE_KINDS as readonly string[]).includes(value);
}

// App language. The UI and Soulom's replies follow it.
export const LANGUAGES = ["th", "en"] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = "th";

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && (LANGUAGES as readonly string[]).includes(value);
}
