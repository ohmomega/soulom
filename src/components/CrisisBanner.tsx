import { useI18n } from "../i18n/I18nProvider";
import { CloseIcon, PhoneIcon } from "./icons";

export function CrisisBanner({ onDismiss }: { onDismiss: () => void }) {
  const { t } = useI18n();
  return (
    <aside
      role="note"
      className="mx-auto mt-3 flex w-[calc(100%-2rem)] max-w-2xl animate-settle items-start gap-3 rounded-2xl border border-clay/30 bg-ink px-4 py-3"
    >
      <PhoneIcon className="mt-1 shrink-0 text-clay" width={18} height={18} />
      <div className="flex-1 text-sm leading-relaxed text-cream-soft">
        <p>{t.crisis.lead}</p>
        <p>
          {t.crisis.callPrefix}{" "}
          <a href="tel:1323" className="font-semibold text-cream underline decoration-clay/60 underline-offset-4">
            {t.crisis.hotline}
          </a>{" "}
          {t.crisis.free}{" "}
          <a href="tel:1669" className="text-cream underline decoration-line-strong underline-offset-4">
            1669
          </a>{" "}
          {t.crisis.emergency}
        </p>
        {t.crisis.abroad && <p className="mt-1 text-muted">{t.crisis.abroad}</p>}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="-mt-1 -mr-1 rounded-full p-1.5 text-muted hover:text-cream"
        aria-label={t.crisis.hide}
      >
        <CloseIcon width={16} height={16} />
      </button>
    </aside>
  );
}
