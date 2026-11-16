import { useState } from "react";
import type { SupporterLicense } from "../../hooks/useSupporterLicense";
import { Modal } from "../Modal";
import { CardPaymentTab } from "./CardPaymentTab";
import { PromptPayTab } from "./PromptPayTab";
import { RedeemCodeSection } from "./RedeemCodeSection";
import { TipJarTab } from "./TipJarTab";

type SupportChannel = "tip-jar" | "promptpay" | "card";

const CHANNELS: Array<{ id: SupportChannel; label: string }> = [
  { id: "tip-jar", label: "เลี้ยงกาแฟ" },
  { id: "promptpay", label: "พร้อมเพย์" },
  { id: "card", label: "บัตร / ต่างประเทศ" },
];

export function SupporterModal({ supporter, onClose }: { supporter: SupporterLicense; onClose: () => void }) {
  const [activeChannel, setActiveChannel] = useState<SupportChannel>("tip-jar");

  return (
    <Modal
      title="Soulom Supporter Space"
      subtitle="Soulom ไม่มีโฆษณา และไม่ขายข้อมูลใคร ค่าเซิร์ฟเวอร์มาจากคนที่อยากให้ที่นี่อยู่ต่อ"
      onClose={onClose}
    >
      <div role="tablist" aria-label="ช่องทางสนับสนุน" className="grid grid-cols-3 gap-1 rounded-2xl bg-night p-1">
        {CHANNELS.map((channel) => {
          const isActive = channel.id === activeChannel;
          return (
            <button
              key={channel.id}
              type="button"
              role="tab"
              id={`support-tab-${channel.id}`}
              aria-selected={isActive}
              aria-controls={`support-panel-${channel.id}`}
              onClick={() => setActiveChannel(channel.id)}
              className={`rounded-xl px-2 py-2 text-[13px] transition-colors ${
                isActive ? "bg-ink-raised font-medium text-cream" : "text-muted hover:text-cream-soft"
              }`}
            >
              {channel.label}
            </button>
          );
        })}
      </div>

      <section
        role="tabpanel"
        id={`support-panel-${activeChannel}`}
        aria-labelledby={`support-tab-${activeChannel}`}
        className="py-5"
      >
        {activeChannel === "tip-jar" && <TipJarTab />}
        {activeChannel === "promptpay" && <PromptPayTab onLicenseIssued={supporter.activate} />}
        {activeChannel === "card" && <CardPaymentTab />}
      </section>

      <RedeemCodeSection supporter={supporter} />
    </Modal>
  );
}
