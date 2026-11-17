import { useCallback, useState } from "react";
import { ChatHeader } from "./components/ChatHeader";
import { Composer } from "./components/Composer";
import { CrisisBanner } from "./components/CrisisBanner";
import { KeepsakeModal } from "./components/memory/KeepsakeModal";
import { MessageList } from "./components/MessageList";
import { PersonaModal } from "./components/PersonaModal";
import { SupporterModal } from "./components/supporter/SupporterModal";
import { personaById } from "./config/personas";
import { useChatSession } from "./hooks/useChatSession";
import { useSupporterLicense } from "./hooks/useSupporterLicense";
import type { SupporterState } from "./lib/soulomApi";

type OpenPanel = "supporter" | "keepsake" | "persona" | null;

export function App() {
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const supporter = useSupporterLicense();
  const { reportServerVerdict } = supporter;

  const handleSupporterState = useCallback(
    (state: SupporterState) => {
      if (state.active) reportServerVerdict(true, state.expiresAt);
      else if (state.rejectedReason && state.rejectedReason !== "unavailable") reportServerVerdict(false);
    },
    [reportServerVerdict],
  );

  const activeLicenseKey = supporter.health === "rejected" ? null : (supporter.license?.key ?? null);
  const session = useChatSession({
    licenseKey: activeLicenseKey,
    isSupporter: supporter.health === "active",
    onSupporterState: handleSupporterState,
  });

  const persona = personaById(session.persona);
  const isSoulomTyping = session.isAwaitingReply || session.isNudging;

  const openSupporter = useCallback(() => setOpenPanel("supporter"), []);
  const openPersona = useCallback(() => setOpenPanel("persona"), []);
  const openKeepsake = useCallback(() => setOpenPanel("keepsake"), []);
  const closePanel = useCallback(() => setOpenPanel(null), []);

  return (
    <div className="flex min-h-full flex-col">
      <ChatHeader
        isSupporter={supporter.health === "active"}
        personaName={persona.name}
        isPersonaLocked={isSoulomTyping}
        onOpenPersona={openPersona}
        onOpenKeepsake={openKeepsake}
        onOpenSupporter={openSupporter}
      />

      {session.isCrisisBannerVisible && <CrisisBanner onDismiss={session.dismissCrisisBanner} />}

      <main className="flex-1">
        <MessageList
          messages={session.messages}
          persona={persona}
          isAwaitingReply={isSoulomTyping}
          notice={session.notice}
          onRetry={session.retryLastReply}
          onOpenSupporter={openSupporter}
        />
      </main>

      <Composer
        disabled={session.isAwaitingReply}
        quota={session.quota}
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
