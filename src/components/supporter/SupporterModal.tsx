import { useState } from "react";
import { supportLinks } from "../../config/supportLinks";
import type { SupporterLicense } from "../../hooks/useSupporterLicense";
import { useI18n } from "../../i18n/I18nProvider";
import { Modal } from "../Modal";
import { CardPaymentTab } from "./CardPaymentTab";
import { PromptPayTab } from "./PromptPayTab";
import { RedeemCodeSection } from "./RedeemCodeSection";
import { TipJarTab } from "./TipJarTab";

type SupportChannel = "tip-jar" | "promptpay" | "card";

// Only channels that are actually set up are shown; unconfigured ones would just say "not available".
const CHANNELS: SupportChannel[] = [
  "tip-jar",
  ...(supportLinks.promptPayEnabled ? (["promptpay"] as const) : []),
  ...(supportLinks.lemonSqueezyUrl ? (["card"] as const) : []),
];
// Codes only come from paid channels; keep the box for anyone who already holds one.
const HAS_PAID_CHANNEL = CHANNELS.length > 1;

export function SupporterModal({ supporter, onClose }: { supporter: SupporterLicense; onClose: () => void }) {
  const { t } = useI18n();
  const [activeChannel, setActiveChannel] = useState<SupportChannel>("tip-jar");

  return (
    <Modal title="Soulom Supporter Space" subtitle={t.supporter.subtitle} onClose={onClose}>
      {CHANNELS.length > 1 && (
        <div
          role="tablist"
          aria-label={t.supporter.channelsAria}
          className="grid grid-cols-3 gap-1 rounded-2xl bg-night p-1"
        >
          {CHANNELS.map((channel) => {
            const isActive = channel === activeChannel;
            return (
              <button
                key={channel}
                type="button"
                role="tab"
                id={`support-tab-${channel}`}
                aria-selected={isActive}
                aria-controls={`support-panel-${channel}`}
                onClick={() => setActiveChannel(channel)}
                className={`rounded-xl px-2 py-2 text-[13px] transition-colors ${
                  isActive ? "bg-ink-raised font-medium text-cream" : "text-muted hover:text-cream-soft"
                }`}
              >
                {t.supporter.channels[channel]}
              </button>
            );
          })}
        </div>
      )}

      <section
        role={CHANNELS.length > 1 ? "tabpanel" : undefined}
        id={`support-panel-${activeChannel}`}
        aria-labelledby={CHANNELS.length > 1 ? `support-tab-${activeChannel}` : undefined}
        className="py-5"
      >
        {activeChannel === "tip-jar" && <TipJarTab />}
        {activeChannel === "promptpay" && <PromptPayTab onLicenseIssued={supporter.activate} />}
        {activeChannel === "card" && <CardPaymentTab />}
      </section>

      {(HAS_PAID_CHANNEL || supporter.license) && <RedeemCodeSection supporter={supporter} />}
    </Modal>
  );
}
