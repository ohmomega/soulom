import type { GuideSection } from "../i18n/strings";
import { useI18n } from "../i18n/I18nProvider";
import { Modal } from "./Modal";

const TONE_STYLES: Record<GuideSection["tone"], { mark: string; markClass: string }> = {
  can: { mark: "✓", markClass: "text-sage" },
  cannot: { mark: "✕", markClass: "text-ember" },
  info: { mark: "•", markClass: "text-cream-soft" },
  help: { mark: "☎", markClass: "text-ember" },
};

interface GuideModalProps {
  onClose: () => void;
}

export function GuideModal({ onClose }: GuideModalProps) {
  const { t } = useI18n();

  return (
    <Modal title={t.guide.title} subtitle={t.guide.subtitle} onClose={onClose}>
      <div className="flex flex-col gap-3">
        {t.guide.sections.map((section) => {
          const tone = TONE_STYLES[section.tone];
          return (
            <section key={section.heading} className="rounded-2xl border border-line px-4 py-3.5">
              <h3 className="text-[15px] font-semibold text-cream">{section.heading}</h3>
              <ul className="mt-2 flex flex-col gap-1.5">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-cream-soft">
                    <span className={`w-4 shrink-0 text-center ${tone.markClass}`} aria-hidden="true">
                      {tone.mark}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted">{t.guide.reopenHint}</p>
      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full rounded-full bg-ember px-4 py-3 text-[15px] font-semibold text-night transition-opacity hover:opacity-90"
      >
        {t.guide.gotIt}
      </button>
    </Modal>
  );
}
