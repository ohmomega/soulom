import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { RENDER_PAGE_SIZE } from "../config/storageLimits";
import type { ChatNotice } from "../hooks/useChatSession";
import type { ChatMessage } from "../types/chat";
import type { PersonaOption } from "../config/personas";

interface MessageListProps {
  messages: ChatMessage[];
  persona: PersonaOption;
  isAwaitingReply: boolean;
  notice: ChatNotice | null;
  onRetry: () => void;
  onOpenSupporter: () => void;
}

const FAILURE_COPY: Record<Extract<ChatNotice, { kind: "failed" }>["reason"], string> = {
  offline: "ดูเหมือนอินเทอร์เน็ตจะหลุดไปแป๊บนึง ข้อความของคุณยังอยู่ ลองส่งอีกครั้งได้เลย",
  unavailable: "ตอนนี้ Soulom ตอบไม่ทัน ลองใหม่อีกทีได้ไหม",
  blocked: "ข้อความนี้ Soulom ตอบให้ไม่ได้ ลองเล่าด้วยคำอื่นดูนะ",
  "not-configured": "เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า GEMINI_API_KEY",
};

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

function NoticeCard({ notice, onRetry, onOpenSupporter }: Omit<MessageListProps, "messages" | "isAwaitingReply" | "persona"> & { notice: ChatNotice }) {
  if (notice.kind === "quota-exceeded") {
    return (
      <div className="animate-settle rounded-2xl border border-line bg-ink px-4 py-3.5 text-sm text-cream-soft">
        <p>คืนนี้คุยกันครบโควตาฟรีของวันแล้วนะ พรุ่งนี้กลับมาคุยกันต่อได้เสมอ</p>
        <p className="mt-1 text-muted">
          ถ้าอยากคุยต่อตอนนี้ แวะดูที่ปุ่มหัวใจมุมขวาบนได้ เป็นการช่วยค่าเซิร์ฟเวอร์ให้ Soulom อยู่ต่อไปด้วย
        </p>
        <button type="button" onClick={onOpenSupporter} className="mt-2 font-medium text-ember hover:underline">
          เปิดพื้นที่สนับสนุน
        </button>
      </div>
    );
  }
  if (notice.kind === "storage-full") {
    return (
      <p className="animate-settle rounded-2xl border border-clay/30 px-4 py-3 text-sm text-clay">
        พื้นที่เก็บข้อมูลในเบราว์เซอร์เต็มแล้ว ลองเก็บความทรงจำเป็นไฟล์ .soulom แล้วล้างแชทเก่าออกนะ
      </p>
    );
  }
  return (
    <div className="animate-settle rounded-2xl border border-line px-4 py-3 text-sm text-cream-soft">
      <p>{FAILURE_COPY[notice.reason]}</p>
      {notice.reason !== "blocked" && notice.reason !== "not-configured" && (
        <button type="button" onClick={onRetry} className="mt-1.5 font-medium text-ember hover:underline">
          ส่งอีกครั้ง
        </button>
      )}
    </div>
  );
}

export function MessageList({ messages, persona, isAwaitingReply, notice, onRetry, onOpenSupporter }: MessageListProps) {
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
          แสดงข้อความก่อนหน้า ({hiddenCount})
        </button>
      )}

      {messages.length === 0 && (
        <div className="mt-[18dvh] animate-fade text-center">
          <p className="text-lg text-cream">{persona.greeting}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {persona.listening}
            <br />
            ทุกอย่างที่คุยเก็บไว้ในเครื่องนี้เท่านั้น
          </p>
        </div>
      )}

      {visibleMessages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isAwaitingReply && (
        <div className="flex gap-1.5 py-2" aria-label="Soulom กำลังพิมพ์">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="size-1.5 animate-breathe rounded-full bg-cream-soft"
              style={{ animationDelay: `${dot * 180}ms` }}
            />
          ))}
        </div>
      )}

      {notice && <NoticeCard notice={notice} onRetry={onRetry} onOpenSupporter={onOpenSupporter} />}
      <div ref={endRef} />
    </div>
  );
}
