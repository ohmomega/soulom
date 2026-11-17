import { useCallback, useEffect, useRef, useState } from "react";
import type { PersonaId } from "../config/personas";
import { NUDGE_TIMING, STORED_MESSAGE_LIMIT } from "../config/storageLimits";
import { containsSelfHarmSignal } from "../lib/crisisDetector";
import { localVault } from "../lib/localVault";
import { requestCompanionReply, requestMemoryNote, requestNudge, type SupporterState } from "../lib/soulomApi";
import type { ChatMessage, ChatRole, QuotaStatus } from "../types/chat";
import type { Language, NudgeKind } from "../../shared/personaIds";

const MEMORY_NOTE_INTERVAL = 10;
const MAX_DRAFT_LENGTH = 4000;
/** Give someone who just opened the app a moment to start typing before a follow-up appears. */
const MIN_SILENCE_WAIT_MS = 8000;

export type ChatNotice =
  | { kind: "quota-exceeded" }
  | { kind: "failed"; reason: "blocked" | "offline" | "unavailable" | "not-configured" }
  | { kind: "storage-full" };

interface ChatSessionOptions {
  licenseKey: string | null;
  isSupporter: boolean;
  language: Language;
  onSupporterState: (state: SupporterState) => void;
  /** Told whether each message reached the AI, so the service-status banner can react. */
  onDelivery?: (delivered: boolean) => void;
}

function createMessage(role: ChatRole, text: string): ChatMessage {
  return { id: crypto.randomUUID(), role, text, createdAt: Date.now() };
}

/**
 * Keeps only the newest `limit` messages so storage and rendering stay light.
 * The memory-note cursor is an index into the list, so it shifts down by however many were dropped.
 */
function capConversation(conversation: ChatMessage[], limit: number): ChatMessage[] {
  const overflow = conversation.length - limit;
  if (overflow <= 0) return conversation;
  localVault.saveMemoryNoteCursor(Math.max(0, localVault.loadMemoryNoteCursor() - overflow));
  return conversation.slice(overflow);
}

export function useChatSession({ licenseKey, isSupporter, language, onSupporterState, onDelivery }: ChatSessionOptions) {
  const storedLimit = isSupporter ? STORED_MESSAGE_LIMIT.supporter : STORED_MESSAGE_LIMIT.free;

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    capConversation(localVault.loadMessages(), storedLimit),
  );
  const [memoryNote, setMemoryNote] = useState<string>(() => localVault.loadMemoryNote());
  const [persona, setPersonaState] = useState<PersonaId>(() => localVault.loadPersona());
  const [nudgesEnabled, setNudgesEnabledState] = useState<boolean>(() => localVault.loadNudgesEnabled());
  const [isAwaitingReply, setIsAwaitingReply] = useState(false);
  const [isNudging, setIsNudging] = useState(false);
  const [notice, setNotice] = useState<ChatNotice | null>(null);
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [isCrisisBannerVisible, setIsCrisisBannerVisible] = useState(false);

  const memoryNoteInFlight = useRef(false);
  const nudgeRequest = useRef<AbortController | null>(null);
  const lastTypedAt = useRef(0);
  const hasDraft = useRef(false);

  const latestState = useRef({
    licenseKey,
    memoryNote,
    persona,
    nudgesEnabled,
    messages,
    quota,
    storedLimit,
    isAwaitingReply,
    language,
    onSupporterState,
    onDelivery,
  });
  latestState.current = {
    licenseKey,
    memoryNote,
    persona,
    nudgesEnabled,
    messages,
    quota,
    storedLimit,
    isAwaitingReply,
    language,
    onSupporterState,
    onDelivery,
  };

  useEffect(() => {
    if (!localVault.saveMessages(messages)) setNotice({ kind: "storage-full" });
  }, [messages]);

  // A lapsed supporter drops back to the free limit.
  useEffect(() => {
    // capConversation writes the memory-note cursor, so keep it out of a state updater (those may run twice).
    const current = latestState.current.messages;
    const capped = capConversation(current, storedLimit);
    if (capped !== current) setMessages(capped);
  }, [storedLimit]);

  const refreshMemoryNoteIfDue = useCallback(async (conversation: ChatMessage[]) => {
    const cursor = Math.min(localVault.loadMemoryNoteCursor(), conversation.length);
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

  const cancelNudge = useCallback(() => {
    nudgeRequest.current?.abort();
    nudgeRequest.current = null;
    setIsNudging(false);
  }, []);

  const fetchReply = useCallback(
    async (conversation: ChatMessage[]) => {
      setIsAwaitingReply(true);
      setNotice(null);
      const {
        licenseKey: currentLicense,
        memoryNote: currentNote,
        persona: currentPersona,
        language: currentLanguage,
        onSupporterState: reportSupporter,
        onDelivery: reportDelivery,
      } = latestState.current;

      const outcome = await requestCompanionReply(
        conversation,
        currentNote,
        currentPersona,
        currentLanguage,
        currentLicense,
      );
      setIsAwaitingReply(false);

      if (outcome.kind === "reply") {
        reportDelivery?.(true);
        if (currentLicense) reportSupporter(outcome.supporter);
        setQuota(outcome.supporter.active ? null : outcome.quota);
        const nextConversation = capConversation(
          [...conversation, createMessage("model", outcome.text)],
          latestState.current.storedLimit,
        );
        setMessages(nextConversation);
        void refreshMemoryNoteIfDue(nextConversation);
        return;
      }

      if (outcome.kind === "quota-exceeded") {
        if (currentLicense) reportSupporter(outcome.supporter);
        setQuota((current) => outcome.quota ?? (current ? { ...current, remaining: 0 } : current));
        setNotice({ kind: "quota-exceeded" });
        return;
      }

      if (outcome.reason === "unavailable" || outcome.reason === "offline") reportDelivery?.(false);
      setNotice({ kind: "failed", reason: outcome.reason });
    },
    [refreshMemoryNoteIfDue],
  );

  /** Soulom speaks first: never twice in a row, never over an unanswered user message, never while typing. */
  const runNudge = useCallback(async (kind: NudgeKind) => {
    const state = latestState.current;
    if (!state.nudgesEnabled || state.isAwaitingReply || nudgeRequest.current || hasDraft.current) return;
    if (state.quota && state.quota.remaining <= 0) return;

    const conversation = state.messages;
    const lastMessage = conversation.at(-1);
    if (!lastMessage || lastMessage.role !== "model") return;
    if (lastMessage.id === localVault.loadLastNudgeId()) return;

    const controller = new AbortController();
    nudgeRequest.current = controller;
    setIsNudging(true);
    const text = await requestNudge(
      conversation,
      state.memoryNote,
      state.persona,
      state.language,
      kind,
      state.licenseKey,
      controller.signal,
    );
    if (nudgeRequest.current === controller) {
      nudgeRequest.current = null;
      setIsNudging(false);
    }

    // Drop it if the person sent something, erased, or restored while we waited.
    if (!text || controller.signal.aborted || latestState.current.messages !== conversation) return;
    const nudgeMessage = createMessage("model", text);
    localVault.saveLastNudgeId(nudgeMessage.id);
    setMessages(capConversation([...conversation, nudgeMessage], latestState.current.storedLimit));
  }, []);

  // "Welcome back": on open, and whenever the installed app comes back to the foreground.
  useEffect(() => {
    const checkReturn = () => {
      if (document.visibilityState !== "visible") return;
      const lastMessage = latestState.current.messages.at(-1);
      if (lastMessage && Date.now() - lastMessage.createdAt >= NUDGE_TIMING.returnAfterMs) void runNudge("return");
    };
    checkReturn();
    document.addEventListener("visibilitychange", checkReturn);
    return () => document.removeEventListener("visibilitychange", checkReturn);
  }, [runNudge]);

  // Gentle follow-up when the chat goes quiet after Soulom's reply.
  useEffect(() => {
    const lastMessage = messages.at(-1);
    if (!nudgesEnabled || isAwaitingReply || !lastMessage || lastMessage.role !== "model") return;
    if (lastMessage.id === localVault.loadLastNudgeId()) return;
    if (Date.now() - lastMessage.createdAt >= NUDGE_TIMING.returnAfterMs) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      const quietSince = Math.max(lastMessage.createdAt, lastTypedAt.current);
      const wait = Math.max(NUDGE_TIMING.silenceAfterMs - (Date.now() - quietSince), MIN_SILENCE_WAIT_MS);
      timer = setTimeout(() => {
        if (document.visibilityState !== "visible") return;
        if (hasDraft.current || Date.now() - lastTypedAt.current < NUDGE_TIMING.silenceAfterMs) {
          schedule();
          return;
        }
        void runNudge("silence");
      }, wait);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [messages, isAwaitingReply, nudgesEnabled, runNudge]);

  const noteDraft = useCallback((draft: string) => {
    lastTypedAt.current = Date.now();
    hasDraft.current = draft.trim().length > 0;
  }, []);

  const sendMessage = useCallback(
    (draft: string) => {
      const text = draft.trim().slice(0, MAX_DRAFT_LENGTH);
      if (!text || isAwaitingReply) return;

      cancelNudge();
      hasDraft.current = false;
      if (containsSelfHarmSignal(text)) setIsCrisisBannerVisible(true);

      const nextConversation = capConversation([...messages, createMessage("user", text)], storedLimit);
      setMessages(nextConversation);
      void fetchReply(nextConversation);
    },
    [cancelNudge, fetchReply, isAwaitingReply, messages, storedLimit],
  );

  const retryLastReply = useCallback(() => {
    if (isAwaitingReply || messages.at(-1)?.role !== "user") return;
    void fetchReply(messages);
  }, [fetchReply, isAwaitingReply, messages]);

  const setPersona = useCallback((next: PersonaId) => {
    setPersonaState(next);
    if (!localVault.savePersona(next)) setNotice({ kind: "storage-full" });
  }, []);

  const setNudgesEnabled = useCallback(
    (enabled: boolean) => {
      if (!enabled) cancelNudge();
      setNudgesEnabledState(enabled);
      if (!localVault.saveNudgesEnabled(enabled)) setNotice({ kind: "storage-full" });
    },
    [cancelNudge],
  );

  const replaceConversation = useCallback(
    (nextMessages: ChatMessage[], nextMemoryNote: string, nextPersona: PersonaId | null) => {
      cancelNudge();
      const kept = nextMessages.slice(-latestState.current.storedLimit);
      localVault.saveMemoryNote(nextMemoryNote);
      localVault.saveMemoryNoteCursor(kept.length);
      localVault.saveLastNudgeId(null);
      setMemoryNote(nextMemoryNote);
      setMessages(kept);
      if (nextPersona) setPersona(nextPersona);
      setNotice(null);
    },
    [cancelNudge, setPersona],
  );

  const eraseConversation = useCallback(() => {
    cancelNudge();
    localVault.clearConversation();
    setMemoryNote("");
    setMessages([]);
    setPersonaState(localVault.loadPersona());
    setNudgesEnabledState(localVault.loadNudgesEnabled());
    setNotice(null);
    setIsCrisisBannerVisible(false);
  }, [cancelNudge]);

  return {
    messages,
    memoryNote,
    persona,
    setPersona,
    nudgesEnabled,
    setNudgesEnabled,
    storedLimit,
    isAwaitingReply,
    isNudging,
    notice,
    quota,
    isCrisisBannerVisible,
    dismissCrisisBanner: () => setIsCrisisBannerVisible(false),
    dismissNotice: () => setNotice(null),
    noteDraft,
    sendMessage,
    retryLastReply,
    replaceConversation,
    eraseConversation,
  };
}

export type ChatSession = ReturnType<typeof useChatSession>;
