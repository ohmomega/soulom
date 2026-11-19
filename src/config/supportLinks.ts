function readSecureUrl(rawValue: string | undefined): string | null {
  if (!rawValue) return null;
  try {
    const url = new URL(rawValue);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

// Public page, safe to ship in the bundle; VITE_KOFI_URL can still override it.
const DEFAULT_KOFI_URL = "https://ko-fi.com/ohmomega";

export const supportLinks = {
  kofiUrl: readSecureUrl(import.meta.env.VITE_KOFI_URL || DEFAULT_KOFI_URL),
  lemonSqueezyUrl: readSecureUrl(import.meta.env.VITE_LEMON_SQUEEZY_URL),
  promptPayEnabled: import.meta.env.VITE_PROMPTPAY_ENABLED === "true",
} as const;
