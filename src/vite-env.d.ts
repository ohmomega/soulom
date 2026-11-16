/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KOFI_URL?: string;
  readonly VITE_LEMON_SQUEEZY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
