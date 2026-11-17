import type { ServiceProblem } from "../hooks/useServiceStatus";
import { useI18n } from "../i18n/I18nProvider";

// Shown only while something is wrong; renders nothing when the service is healthy.
export function ServiceStatusBanner({ problem, onRecheck }: { problem: ServiceProblem; onRecheck: () => void }) {
  const { t } = useI18n();
  if (!problem) return null;

  return (
    <div
      role="status"
      className="mx-auto mt-3 flex w-[calc(100%-2rem)] max-w-2xl animate-settle items-start gap-3 rounded-2xl border border-ember/35 bg-ink px-4 py-3 text-sm leading-relaxed text-cream-soft"
    >
      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-ember" aria-hidden="true" />
      <p className="flex-1">{t.status[problem]}</p>
      {problem !== "offline" && (
        <button type="button" onClick={onRecheck} className="shrink-0 text-xs font-medium text-ember hover:underline">
          {t.status.recheck}
        </button>
      )}
    </div>
  );
}
