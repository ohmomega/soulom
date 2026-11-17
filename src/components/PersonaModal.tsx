import { PERSONAS, type PersonaId } from "../config/personas";
import { Modal } from "./Modal";

interface PersonaModalProps {
  current: PersonaId;
  onSelect: (persona: PersonaId) => void;
  onClose: () => void;
}

export function PersonaModal({ current, onSelect, onClose }: PersonaModalProps) {
  return (
    <Modal title="เลือกบุคลิกของ Soulom" subtitle="เปลี่ยนได้ทุกเมื่อ เรื่องที่คุยไว้ยังจำได้เหมือนเดิม" onClose={onClose}>
      <ul className="flex flex-col gap-3" role="radiogroup" aria-label="บุคลิก">
        {PERSONAS.map((persona) => {
          const isSelected = persona.id === current;
          return (
            <li key={persona.id}>
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  onSelect(persona.id);
                  onClose();
                }}
                className={`w-full rounded-2xl border px-4 py-3.5 text-left transition-colors ${
                  isSelected
                    ? "border-ember/70 bg-ember/10"
                    : "border-line hover:border-line-strong hover:bg-ink-raised"
                }`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="text-[15px] font-semibold text-cream">{persona.name}</span>
                  {isSelected && <span className="text-xs font-medium text-ember">กำลังใช้</span>}
                </span>
                <span className="mt-0.5 block text-sm text-muted">{persona.summary}</span>
                <span className="mt-2.5 block rounded-xl bg-night/70 px-3 py-2 text-sm leading-relaxed text-cream-soft">
                  “{persona.sample}”
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs leading-relaxed text-muted">
        ทุกบุคลิกดูแลความปลอดภัยแบบเดียวกัน และบอกตามจริงเสมอว่าเป็น AI
      </p>
    </Modal>
  );
}
