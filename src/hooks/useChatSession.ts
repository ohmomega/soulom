import { useCallback, useEffect, useRef, useState } from "react";
import { containsSelfHarmSignal } from "../lib/crisisDetector";
import { localVault } from "../lib/localVault";
import { requestCompanionReply, requestMemoryNote, type SupporterState } from "../lib/soulomApi";
import type { ChatMessage, ChatRole, QuotaStatus } from "../types/chat";

const MEMORY_NOTE_INTERVAL = 10;
const MAX_DRAFT_LENGTH = 4000;

export type ChatNotice =
  | { kind: "quota-exceeded" }
  | { kind: "failed"; reason: "blocked" | "offline" | "unavailable" | "not-configured" }
  | { kind: "storage-full" };

interface ChatSessionOptions {
  licenseKey: string | null;
  onSupporterState: (state: SupporterState) => void;
}

function createMessage(role: ChatRole, text: string): ChatMessage {
  return { id: crypto.randomUUID(), role, text, createdAt: Date.now() };
}

export function useChatSession({ licenseKey, onSupporterState }: ChatSessionOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => localVault.loadMessages());
  const [memoryNote, setMemoryNote] = useState<string>(() => localVault.loadMemoryNote());
  const [isAwaitingReply, setIsAwaitingReply] = useState(false);
  const [notice, setNotice] = useState<ChatNotice | null>(null);
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [isCrisisBannerVisible, setIsCrisisBannerVisible] = useState(false);

  const memoryNoteInFlight = useRef(false);
  const latestState = useRef({ licenseKey, memoryNote, onSupporterState });
  latestState.current = { licenseKey, memoryNote, onSupporterState };

  useEffect(() => {
    if (!localVault.saveMessages(messages)) setNotice({ kind: "storage-full" });
  }, [messages]);

  const refreshMemoryNoteIfDue = useCallback(async (conversation: ChatMessage[]) => {
    const cursor = localVault.loadMemoryNoteCursor();
    if (memoryNoteInFlight.current || conversation.length - cursor < MEMORY_NOTE_INTERVAL) return;

    memoryNoteInFlight.current = true;
    try {
      const nextNote = await requestMemoryNote(conversation, latestState.current.memoryNote, latestState.current.licenseKey);
      if (nextNote) {
        localVault.saveMemoryNote(nextNote);
        localVault.saveMemoryNoteCursor(conversation.length);
        setMemoryNote(nextNote);
      }
    } finally {
      memoryNoteInFlight.current = false;
    }
  }, []);

  const fetchReply = useCallback(
    async (conversation: ChatMessage[]) => {
      setIsAwaitingReply(true);
      setNotice(null);
      const { licenseKey: currentLicense, memoryNote: currentNote, onSupporterState: reportSupporter } =
        latestState.current;

      const outcome = await requestCompanionReply(conversation, currentNote, currentLicense);
      setIsAwaitingReply(false);

      if (outcome.kind === "reply") {
        if (currentLicense) reportSupporter(outcome.supporter);
        setQuota(outcome.supporter.active ? null : outcome.quota);
        const nextConversation = [...conversation, createMessage("model", outcome.text)];
        setMessages(nextConversation);
        void refreshMemoryNoteIfDue(nextConversation);
        return;
      }

      if (outcome.kind === "quota-exceeded") {
        if (currentLicense) reportSupporter(outcome.supporter);
        setQuota((current) => (current ? { ...current, remaining: 0 } : current));
        setNotice({ kind: "quota-exceeded" });
        return;
      }

      setNotice({ kind: "failed", reason: outcome.reason });
    },
    [refreshMemoryNoteIfDue],
  );

  const sendMessage = useCallback(
    (draft: string) => {
      const text = draft.trim().slice(0, MAX_DRAFT_LENGTH);
      if (!text || isAwaitingReply) return;

      if (containsSelfHarmSignal(text)) setIsCrisisBannerVisible(true);

      const nextConversation = [...messages, createMessage("user", text)];
      setMessages(nextConversation);
      void fetchReply(nextConversation);
    },
    [fetchReply, isAwaitingReply, messages],
  );

  const retryLastReply = useCallback(() => {
    if (isAwaitingReply || messages.at(-1)?.role !== "user") return;
    void fetchReply(messages);
  }, [fetchReply, isAwaitingReply, messages]);

  const replaceConversation = useCallback((nextMessages: ChatMessage[], nextMemoryNote: string) => {
    localVault.saveMemoryNote(nextMemoryNote);
    localVault.saveMemoryNoteCursor(nextMessages.length);
    setMemoryNote(nextMemoryNote);
    setMessages(nextMessages);
    setNotice(null);
  }, []);

  const eraseConversation = useCallback(() => {
    localVault.clearConversation();
    setMemoryNote("");
    setMessages([]);
    setNotice(null);
    setIsCrisisBannerVisible(false);
  }, []);

  return {
    messages,
    memoryNote,
    isAwaitingReply,
    notice,
    quota,
    isCrisisBannerVisible,
    dismissCrisisBanner: () => setIsCrisisBannerVisible(false),
    dismissNotice: () => setNotice(null),
    sendMessage,
    retryLastReply,
    replaceConversation,
    eraseConversation,
  };
}

export type ChatSession = ReturnType<typeof useChatSession>;
