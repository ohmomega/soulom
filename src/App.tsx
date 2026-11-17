import { useCallback, useState } from "react";
import { ChatHeader } from "./components/ChatHeader";
import { Composer } from "./components/Composer";
import { CrisisBanner } from "./components/CrisisBanner";
import { KeepsakeModal } from "./components/memory/KeepsakeModal";
import { MessageList } from "./components/MessageList";
import { PersonaModal } from "./components/PersonaModal";
import { ServiceStatusBanner } from "./components/ServiceStatusBanner";
import { SupporterModal } from "./components/supporter/SupporterModal";
import { personaById } from "./config/personas";
import { useChatSession } from "./hooks/useChatSession";
import { useServiceStatus } from "./hooks/useServiceStatus";
import { useSupporterLicense } from "./hooks/useSupporterLicense";
import { useI18n } from "./i18n/I18nProvider";
import type { SupporterState } from "./lib/soulomApi";

type OpenPanel = "supporter" | "keepsake" | "persona" | null;

export function App() {
  const { t, language } = useI18n();
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const supporter = useSupporterLicense();
  const { reportServerVerdict } = supporter;
  const isSupporter = supporter.health === "active";

  const service = useServiceStatus(!isSupporter);
  const { check: recheckService, reportSuccess } = service;

  const handleSupporterState = useCallback(
    (state: SupporterState) => {
      if (state.active) reportServerVerdict(true, state.expiresAt);
      else if (state.rejectedReason && state.rejectedReason !== "unavailable") reportServerVerdict(false);
    },
    [reportServerVerdict],
  );

  const handleDelivery = useCallback(
    (delivered: boolean) => {
      if (delivered) reportSuccess();
      else void recheckService();
    },
    [reportSuccess, recheckService],
  );

  const activeLicenseKey = supporter.health === "rejected" ? null : (supporter.license?.key ?? null);
  const session = useChatSession({
    licenseKey: activeLicenseKey,
    isSupporter,
    language,
    onSupporterState: handleSupporterState,
    onDelivery: handleDelivery,
  });

  const persona = personaById(session.persona, t);
  const isSoulomTyping = session.isAwaitingReply || session.isNudging;
  // The latest reply's numbers win; before the first message, show what /api/status reported.
  const quota = isSupporter ? null : (session.quota ?? service.quota);

  const openSupporter = useCallback(() => setOpenPanel("supporter"), []);
  const openPersona = useCallback(() => setOpenPanel("persona"), []);
  const openKeepsake = useCallback(() => setOpenPanel("keepsake"), []);
  const closePanel = useCallback(() => setOpenPanel(null), []);

  return (
    <div className="flex min-h-full flex-col">
      <ChatHeader
        isSupporter={isSupporter}
        personaName={persona.name}
        isPersonaLocked={isSoulomTyping}
        onOpenPersona={openPersona}
        onOpenKeepsake={openKeepsake}
        onOpenSupporter={openSupporter}
      />

      <ServiceStatusBanner problem={service.problem} onRecheck={recheckService} />
      {session.isCrisisBannerVisible && <CrisisBanner onDismiss={session.dismissCrisisBanner} />}

      <main className="flex-1">
        <MessageList
          messages={session.messages}
          persona={persona}
          isAwaitingReply={isSoulomTyping}
          notice={session.notice}
          quota={quota}
          onRetry={session.retryLastReply}
          onOpenSupporter={openSupporter}
        />
      </main>

      <Composer
        disabled={session.isAwaitingReply}
        quota={quota}
        onSend={session.sendMessage}
        onDraftChange={session.noteDraft}
      />

      {openPanel === "supporter" && <SupporterModal supporter={supporter} onClose={closePanel} />}
      {openPanel === "persona" && (
        <PersonaModal
          current={session.persona}
          nudgesEnabled={session.nudgesEnabled}
          onSelect={session.setPersona}
          onToggleNudges={session.setNudgesEnabled}
          onClose={closePanel}
        />
      )}
      {openPanel === "keepsake" && <KeepsakeModal session={session} supporter={supporter} onClose={closePanel} />}
    </div>
  );
}
