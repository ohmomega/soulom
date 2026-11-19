/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KOFI_URL?: string;
  readonly VITE_LEMON_SQUEEZY_URL?: string;
  /** "true" shows the PromptPay tab (needs a real QR in public/promptpay-qr.png and SLIP_VERIFY_* secrets). */
  readonly VITE_PROMPTPAY_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
