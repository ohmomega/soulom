import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { QuotaStatus } from "../types/chat";
import { SendIcon } from "./icons";

interface ComposerProps {
  disabled: boolean;
  quota: QuotaStatus | null;
  onSend: (text: string) => void;
  onDraftChange?: (draft: string) => void;
}

const MAX_TEXTAREA_HEIGHT = 160;

export function Composer({ disabled, quota, onSend, onDraftChange }: ComposerProps) {
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [draft]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (disabled || !draft.trim()) return;
    onSend(draft);
    setDraft("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && !isTouchDevice) {
      submit();
    }
  };

  return (
    <div className="sticky bottom-0 border-t border-line/70 bg-night pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <form onSubmit={submit} className="mx-auto flex max-w-2xl items-end gap-2 px-4 pt-3">
        <label htmlFor="soulom-composer" className="sr-only">
          พิมพ์ข้อความถึง Soulom
        </label>
        <textarea
          id="soulom-composer"
          ref={textareaRef}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            onDraftChange?.(event.target.value);
          }}
          onKeyDown={handleKeyDown}
          rows={1}
          maxLength={4000}
          placeholder="เล่าให้ฟังหน่อย…"
          className="min-h-11 flex-1 resize-none rounded-2xl border border-line bg-ink px-4 py-2.5 text-[15px] text-cream placeholder:text-muted focus:border-line-strong focus:outline-none"
        />
        <button
          type="submit"
          disabled={disabled || !draft.trim()}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ember text-night transition-colors hover:bg-ember-deep disabled:bg-ink-raised disabled:text-muted"
          aria-label="ส่ง"
        >
          <SendIcon />
        </button>
      </form>
      {quota && (
        <p className="mx-auto mt-1.5 max-w-2xl px-5 text-xs text-muted">
          วันนี้คุยฟรีได้อีก {quota.remaining} จาก {quota.limit} ข้อความ
        </p>
      )}
    </div>
  );
}
