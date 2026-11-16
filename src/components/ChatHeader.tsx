import { HeartIcon, KeepsakeIcon, MoonMark } from "./icons";

interface ChatHeaderProps {
  isSupporter: boolean;
  onOpenKeepsake: () => void;
  onOpenSupporter: () => void;
}

export function ChatHeader({ isSupporter, onOpenKeepsake, onOpenSupporter }: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-night/95 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <div className="flex items-center gap-2.5 text-cream">
          <MoonMark />
          <span className="text-[17px] font-semibold tracking-wide">Soulom</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenKeepsake}
            className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted transition-colors hover:bg-ink-raised hover:text-cream"
            aria-label="ความทรงจำ: เก็บหรือกู้คืนไฟล์ .soulom"
          >
            <KeepsakeIcon width={18} height={18} />
            <span className="hidden sm:inline">ความทรงจำ</span>
          </button>
          <button
            type="button"
            onClick={onOpenSupporter}
            className="relative rounded-full p-2 text-muted transition-colors hover:bg-ink-raised hover:text-ember"
            aria-label={isSupporter ? "สนับสนุน (คุณเป็นผู้สนับสนุนแล้ว)" : "สนับสนุน"}
            title="สนับสนุน"
          >
            <HeartIcon width={18} height={18} />
            {isSupporter && <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-sage" />}
          </button>
        </div>
      </div>
    </header>
  );
}
