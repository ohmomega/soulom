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
}

export interface StoredLicense {
  key: string;
  expiresAt: string | null;
}
