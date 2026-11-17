import { PERSONAS, type PersonaId } from "../config/personas";
import { Modal } from "./Modal";

interface PersonaModalProps {
  current: PersonaId;
  nudgesEnabled: boolean;
  onSelect: (persona: PersonaId) => void;
  onToggleNudges: (enabled: boolean) => void;
  onClose: () => void;
}

export function PersonaModal({ current, nudgesEnabled, onSelect, onToggleNudges, onClose }: PersonaModalProps) {
  return (
    <Modal title="เลือกบุคลิกของ Soulom" subtitle="เปลี่ยนได้ทุกเมื่อ เรื่องที่คุยไว้ยังจำได้เหมือนเดิม" onClose={onClose}>
      <div className="flex flex-col gap-3">
        {PERSONAS.map((persona) => {
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
                {isSelected && <span className="text-xs font-medium text-ember">กำลังใช้</span>}
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
          <span className="block text-[15px] font-medium text-cream">ให้ Soulom ทักก่อนได้</span>
          <span className="mt-0.5 block text-sm leading-relaxed text-muted">
            ทักเมื่อกลับมาเปิดแอป หรือชวนคุยเบาๆ เมื่อแชทเงียบไปสักพัก ไม่หักโควตาข้อความของคุณ
          </span>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={nudgesEnabled}
          onChange={(event) => onToggleNudges(event.target.checked)}
          className="mt-1 size-5 shrink-0 accent-ember"
        />
      </label>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        ทุกบุคลิกดูแลความปลอดภัยแบบเดียวกัน และบอกตามจริงเสมอว่าเป็น AI
      </p>
    </Modal>
  );
}
