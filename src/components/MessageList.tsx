import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PersonaOption } from "../config/personas";
import { RENDER_PAGE_SIZE } from "../config/storageLimits";
import type { ChatNotice } from "../hooks/useChatSession";
import { useI18n } from "../i18n/I18nProvider";
import { describeReset, useMinuteClock } from "../i18n/resetTime";
import type { ChatMessage, QuotaStatus } from "../types/chat";

interface MessageListProps {
  messages: ChatMessage[];
  persona: PersonaOption;
  isAwaitingReply: boolean;
  notice: ChatNotice | null;
  quota: QuotaStatus | null;
  onRetry: () => void;
  onOpenSupporter: () => void;
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-ink-raised px-4 py-2.5 break-words whitespace-pre-wrap text-cream">
          {message.text}
        </p>
      </div>
    );
  }
  return <p className="max-w-[92%] break-words whitespace-pre-wrap text-cream-soft">{message.text}</p>;
}

interface NoticeCardProps {
  notice: ChatNotice;
  quota: QuotaStatus | null;
  onRetry: () => void;
  onOpenSupporter: () => void;
}

function NoticeCard({ notice, quota, onRetry, onOpenSupporter }: NoticeCardProps) {
  const { t } = useI18n();
  const now = useMinuteClock(notice.kind === "quota-exceeded" && Boolean(quota?.resetAt));

  if (notice.kind === "quota-exceeded") {
    const reset = quota?.resetAt && quota.resetAt > now ? describeReset(quota.resetAt, now, t) : null;
    return (
      <div className="animate-settle rounded-2xl border border-line bg-ink px-4 py-3.5 text-sm text-cream-soft">
        <p>{t.chat.quotaExceeded}</p>
        {reset && <p className="mt-1">{t.chat.quotaResetsAt(reset.time, reset.countdown)}</p>}
        <p className="mt-1 text-muted">{t.chat.quotaSupport}</p>
        <button type="button" onClick={onOpenSupporter} className="mt-2 font-medium text-ember hover:underline">
          {t.chat.openSupport}
        </button>
      </div>
    );
  }
  if (notice.kind === "storage-full") {
    return (
      <p className="animate-settle rounded-2xl border border-clay/30 px-4 py-3 text-sm text-clay">{t.chat.storageFull}</p>
    );
  }
  return (
    <div className="animate-settle rounded-2xl border border-line px-4 py-3 text-sm text-cream-soft">
      <p>{t.chat.failures[notice.reason]}</p>
      {notice.reason !== "blocked" && notice.reason !== "not-configured" && (
        <button type="button" onClick={onRetry} className="mt-1.5 font-medium text-ember hover:underline">
          {t.chat.retry}
        </button>
      )}
    </div>
  );
}

export function MessageList({
  messages,
  persona,
  isAwaitingReply,
  notice,
  quota,
  onRetry,
  onOpenSupporter,
}: MessageListProps) {
  const { t } = useI18n();
  const endRef = useRef<HTMLDivElement>(null);
  // Only the newest messages are drawn, so a long history doesn't slow the phone down.
  const [visibleCount, setVisibleCount] = useState(RENDER_PAGE_SIZE);
  const heightBeforeExpand = useRef<number | null>(null);
  const hiddenCount = Math.max(0, messages.length - visibleCount);
  const visibleMessages = hiddenCount > 0 ? messages.slice(hiddenCount) : messages;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isAwaitingReply, notice]);

  // Keep the reader's place when older messages are inserted above.
  useLayoutEffect(() => {
    if (heightBeforeExpand.current === null) return;
    window.scrollBy(0, document.documentElement.scrollHeight - heightBeforeExpand.current);
    heightBeforeExpand.current = null;
  }, [visibleCount]);

  const showEarlier = () => {
    heightBeforeExpand.current = document.documentElement.scrollHeight;
    setVisibleCount((count) => count + RENDER_PAGE_SIZE);
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6" aria-live="polite">
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={showEarlier}
          className="self-center rounded-full border border-line px-4 py-1.5 text-xs text-muted transition-colors hover:border-line-strong hover:text-cream"
        >
          {t.chat.showEarlier(hiddenCount)}
        </button>
      )}

      {messages.length === 0 && (
        <div className="mt-[18dvh] animate-fade text-center">
          <p className="text-lg text-cream">{persona.greeting}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {persona.listening}
            <br />
            {t.chat.localOnly}
          </p>
        </div>
      )}

      {visibleMessages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isAwaitingReply && (
        <div className="flex gap-1.5 py-2" aria-label={t.chat.typing}>
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="size-1.5 animate-breathe rounded-full bg-cream-soft"
              style={{ animationDelay: `${dot * 180}ms` }}
            />
          ))}
        </div>
      )}

      {notice && <NoticeCard notice={notice} quota={quota} onRetry={onRetry} onOpenSupporter={onOpenSupporter} />}
      <div ref={endRef} />
    </div>
  );
}
