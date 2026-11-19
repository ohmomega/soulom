import { useI18n } from "../i18n/I18nProvider";
import { HeartIcon, HelpIcon, KeepsakeIcon, MoonMark } from "./icons";

interface ChatHeaderProps {
  isSupporter: boolean;
  personaName: string;
  isPersonaLocked: boolean;
  onOpenPersona: () => void;
  onOpenKeepsake: () => void;
  onOpenSupporter: () => void;
  onOpenGuide: () => void;
}

export function ChatHeader({
  isSupporter,
  personaName,
  isPersonaLocked,
  onOpenPersona,
  onOpenKeepsake,
  onOpenSupporter,
  onOpenGuide,
}: ChatHeaderProps) {
  const { t, language, setLanguage } = useI18n();

  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-night/95 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 items-center gap-2.5 text-cream">
          <MoonMark />
          <span className="text-[17px] font-semibold tracking-wide">Soulom</span>
          <button
            type="button"
            onClick={onOpenPersona}
            disabled={isPersonaLocked}
            title={isPersonaLocked ? t.header.personaLocked : undefined}
            className="flex min-w-0 items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs text-cream-soft transition-colors hover:border-line-strong hover:text-cream disabled:opacity-50"
            aria-label={t.header.personaAria(personaName)}
          >
            <span className="truncate">{personaName}</span>
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className="shrink-0 opacity-70">
              <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => setLanguage(language === "th" ? "en" : "th")}
            className="rounded-full px-2.5 py-2 text-xs font-medium text-muted transition-colors hover:bg-ink-raised hover:text-cream"
            aria-label={t.header.languageAria}
            title={t.header.languageAria}
          >
            {t.header.languageButton}
          </button>
          <button
            type="button"
            onClick={onOpenGuide}
            className="rounded-full p-2 text-muted transition-colors hover:bg-ink-raised hover:text-cream"
            aria-label={t.guide.headerAria}
            title={t.guide.headerAria}
          >
            <HelpIcon width={18} height={18} />
          </button>
          <button
            type="button"
            onClick={onOpenKeepsake}
            className="flex items-center gap-2 rounded-full px-2.5 py-2 text-sm text-muted transition-colors hover:bg-ink-raised hover:text-cream"
            aria-label={t.header.keepsakeAria}
          >
            <KeepsakeIcon width={18} height={18} />
            <span className="hidden sm:inline">{t.header.keepsake}</span>
          </button>
          <button
            type="button"
            onClick={onOpenSupporter}
            className="relative rounded-full p-2 text-muted transition-colors hover:bg-ink-raised hover:text-ember"
            aria-label={isSupporter ? t.header.supportActiveAria : t.header.support}
            title={t.header.support}
          >
            <HeartIcon width={18} height={18} />
            {isSupporter && <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-sage" />}
          </button>
        </div>
      </div>
    </header>
  );
}
