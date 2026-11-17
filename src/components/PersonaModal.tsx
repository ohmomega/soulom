import { personaOptions, type PersonaId } from "../config/personas";
import { useI18n } from "../i18n/I18nProvider";
import { Modal } from "./Modal";

interface PersonaModalProps {
  current: PersonaId;
  nudgesEnabled: boolean;
  onSelect: (persona: PersonaId) => void;
  onToggleNudges: (enabled: boolean) => void;
  onClose: () => void;
}

export function PersonaModal({ current, nudgesEnabled, onSelect, onToggleNudges, onClose }: PersonaModalProps) {
  const { t } = useI18n();

  return (
    <Modal title={t.persona.title} subtitle={t.persona.subtitle} onClose={onClose}>
      <div className="flex flex-col gap-3">
        {personaOptions(t).map((persona) => {
          const isSelected = persona.id === current;
          return (
            <button
              key={persona.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => {
                onSelect(persona.id);
                onClose();
              }}
              className={`w-full rounded-2xl border px-4 py-3.5 text-left transition-colors ${
                isSelected ? "border-ember/70 bg-ember/10" : "border-line hover:border-line-strong hover:bg-ink-raised"
              }`}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-[15px] font-semibold text-cream">{persona.name}</span>
                {isSelected && <span className="text-xs font-medium text-ember">{t.persona.current}</span>}
              </span>
              <span className="mt-0.5 block text-sm text-muted">{persona.summary}</span>
              <span className="mt-2.5 block rounded-xl bg-night/70 px-3 py-2 text-sm leading-relaxed text-cream-soft">
                “{persona.sample}”
              </span>
            </button>
          );
        })}
      </div>

      <label className="mt-5 flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-line px-4 py-3.5">
        <span>
          <span className="block text-[15px] font-medium text-cream">{t.persona.nudgeTitle}</span>
          <span className="mt-0.5 block text-sm leading-relaxed text-muted">{t.persona.nudgeDetail}</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={nudgesEnabled}
          onChange={(event) => onToggleNudges(event.target.checked)}
          className="mt-1 size-5 shrink-0 accent-ember"
        />
      </label>

      <p className="mt-4 text-xs leading-relaxed text-muted">{t.persona.safetyNote}</p>
    </Modal>
  );
}
