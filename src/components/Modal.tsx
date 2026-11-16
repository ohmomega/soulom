import { useEffect, useId, useRef, type ReactNode } from "react";
import { CloseIcon } from "./icons";

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, subtitle, onClose, children }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade bg-black/65" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[92dvh] w-full animate-settle flex-col rounded-t-3xl border border-line bg-ink outline-none sm:max-w-lg sm:rounded-3xl"
      >
        <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-cream">
              {title}
            </h2>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 rounded-full p-2 text-muted transition-colors hover:bg-ink-raised hover:text-cream"
            aria-label="ปิด"
          >
            <CloseIcon />
          </button>
        </header>
        <div className="overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
}
