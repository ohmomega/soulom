export type ChatRole = "user" | "model";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: number;
}

export interface QuotaStatus {
  limit: number;
  remaining: number;
  /** Epoch ms when the free allowance refills (midnight in Thailand). */
  resetAt: number | null;
}

export interface StoredLicense {
  key: string;
  expiresAt: string | null;
}
