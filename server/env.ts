export interface SoulomEnv {
  GEMINI_API_KEY?: string;
  SOULOM_KV?: KVNamespace;
  FREE_DAILY_MESSAGE_LIMIT?: string;
  LEMON_SQUEEZY_API_KEY?: string;
  SLIP_VERIFY_URL?: string;
  SLIP_VERIFY_API_KEY?: string;
  SLIP_VERIFY_FILE_FIELD?: string;
  SLIP_MIN_AMOUNT_THB?: string;
  SLIP_RECEIVER_NAME?: string;
}

export function readPositiveInteger(rawValue: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(rawValue ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
