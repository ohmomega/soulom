import type { SoulomEnv } from "./env";
import { sha256Hex } from "./http";
import { readJsonValue, type KeyValueStore } from "./keyValueStore";

export const THAI_LICENSE_PREFIX = "SOULOM-TH-";
export const THAI_LICENSE_LIFETIME_SECONDS = 30 * 24 * 60 * 60;

const LICENSE_KEY_PATTERN = /^[A-Za-z0-9-]{8,128}$/;
const LICENSE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LEMON_SQUEEZY_VALIDATE_URL = "https://api.lemonsqueezy.com/v1/licenses/validate";
const POSITIVE_VERDICT_CACHE_SECONDS = 6 * 60 * 60;
const NEGATIVE_VERDICT_CACHE_SECONDS = 5 * 60;

export interface ThaiLicenseRecord {
  issuedAt: string;
  expiresAt: string;
  transRef: string;
}

export type LicenseVerdict =
  | { valid: true; source: "promptpay" | "lemon-squeezy"; expiresAt: string | null }
  | { valid: false; reason: "malformed" | "unknown" | "expired" | "unavailable" };

export function thaiLicenseStoreKey(licenseKey: string): string {
  return `license:${licenseKey}`;
}

export function generateThaiLicenseKey(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(12));
  const characters = [...randomBytes].map((byte) => LICENSE_CODE_ALPHABET[byte % LICENSE_CODE_ALPHABET.length]);
  const groups = [characters.slice(0, 4), characters.slice(4, 8), characters.slice(8, 12)].map((group) => group.join(""));
  return `${THAI_LICENSE_PREFIX}${groups.join("-")}`;
}

async function verifyThaiLicense(licenseKey: string, store: KeyValueStore): Promise<LicenseVerdict> {
  const record = await readJsonValue<ThaiLicenseRecord>(store, thaiLicenseStoreKey(licenseKey));
  if (!record) return { valid: false, reason: "unknown" };
  if (Date.parse(record.expiresAt) <= Date.now()) return { valid: false, reason: "expired" };
  return { valid: true, source: "promptpay", expiresAt: record.expiresAt };
}

interface LemonSqueezyValidateResponse {
  valid?: boolean;
  license_key?: { status?: string; expires_at?: string | null };
}

async function verifyLemonSqueezyLicense(
  licenseKey: string,
  apiKey: string,
  store: KeyValueStore,
): Promise<LicenseVerdict> {
  const cacheKey = `license-cache:lemon:${await sha256Hex(licenseKey)}`;
  const cachedVerdict = await readJsonValue<LicenseVerdict>(store, cacheKey);
  if (cachedVerdict) return cachedVerdict;

  let response: Response;
  try {
    response = await fetch(LEMON_SQUEEZY_VALIDATE_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ license_key: licenseKey }),
    });
  } catch {
    return { valid: false, reason: "unavailable" };
  }

  if (response.status >= 500) return { valid: false, reason: "unavailable" };

  const payload = (await response.json().catch(() => null)) as LemonSqueezyValidateResponse | null;
  const expiresAt = payload?.license_key?.expires_at ?? null;
  const isExpired = payload?.license_key?.status === "expired" || (expiresAt !== null && Date.parse(expiresAt) <= Date.now());

  const verdict: LicenseVerdict =
    payload?.valid === true && !isExpired
      ? { valid: true, source: "lemon-squeezy", expiresAt }
      : { valid: false, reason: isExpired ? "expired" : "unknown" };

  await store.put(cacheKey, JSON.stringify(verdict), {
    expirationTtl: verdict.valid ? POSITIVE_VERDICT_CACHE_SECONDS : NEGATIVE_VERDICT_CACHE_SECONDS,
  });
  return verdict;
}

export function normalizeLicenseKey(rawKey: string): string | null {
  const trimmed = rawKey.trim();
  if (!LICENSE_KEY_PATTERN.test(trimmed)) return null;
  return trimmed.toUpperCase().startsWith(THAI_LICENSE_PREFIX) ? trimmed.toUpperCase() : trimmed;
}

export async function verifyLicenseKey(rawKey: string, env: SoulomEnv, store: KeyValueStore): Promise<LicenseVerdict> {
  const licenseKey = normalizeLicenseKey(rawKey);
  if (!licenseKey) return { valid: false, reason: "malformed" };

  if (licenseKey.startsWith(THAI_LICENSE_PREFIX)) return verifyThaiLicense(licenseKey, store);
  if (env.LEMON_SQUEEZY_API_KEY) return verifyLemonSqueezyLicense(licenseKey, env.LEMON_SQUEEZY_API_KEY, store);
  return { valid: false, reason: "unknown" };
}
