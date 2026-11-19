function readSecureUrl(rawValue: string | undefined): string | null {
  if (!rawValue) return null;
  try {
    const url = new URL(rawValue);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export const supportLinks = {
  kofiUrl: readSecureUrl(import.meta.env.VITE_KOFI_URL),
  lemonSqueezyUrl: readSecureUrl(import.meta.env.VITE_LEMON_SQUEEZY_URL),
  promptPayEnabled: import.meta.env.VITE_PROMPTPAY_ENABLED === "true",
} as const;
