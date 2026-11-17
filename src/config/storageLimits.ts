// How much chat history stays on the device. Older messages are dropped (the memory note keeps the gist),
// so localStorage stays small (~0.2 MB free, ~0.7 MB supporter for typical Thai chat) and the app stays light.
export const STORED_MESSAGE_LIMIT = {
  free: 300,
  supporter: 1000,
} as const;

// How many messages are drawn at once; "show earlier" reveals more in steps of this size.
export const RENDER_PAGE_SIZE = 60;

// Companion check-ins.
export const NUDGE_TIMING = {
  /** Reopening the app after this long since the last message gets a "welcome back" check-in. */
  returnAfterMs: 60 * 60 * 1000,
  /** Quiet this long after a reply (app visible, nothing typed) gets one gentle follow-up. */
  silenceAfterMs: 4 * 60 * 1000,
} as const;
