import type { ChatSession } from "../../hooks/useChatSession";
import type { SupporterLicense } from "../../hooks/useSupporterLicense";
import { useI18n } from "../../i18n/I18nProvider";
import { Modal } from "../Modal";
import { EraseMemorySection } from "./EraseMemorySection";
import { ExportMemorySection } from "./ExportMemorySection";
import { ImportMemorySection } from "./ImportMemorySection";

interface KeepsakeModalProps {
  session: ChatSession;
  supporter: SupporterLicense;
  onClose: () => void;
}

export function KeepsakeModal({ session, supporter, onClose }: KeepsakeModalProps) {
  const { t } = useI18n();
  return (
    <Modal title={t.keepsake.title} subtitle={t.keepsake.subtitle} onClose={onClose}>
      <div className="space-y-6 pb-2">
        <p className="rounded-xl bg-night/70 px-3 py-2.5 text-xs leading-relaxed text-muted">
          {t.keepsake.storage(
            session.messages.length.toLocaleString(t.locale),
            session.storedLimit.toLocaleString(t.locale),
          )}
        </p>
        <ExportMemorySection
          messages={session.messages}
          memoryNote={session.memoryNote}
          licenseKey={supporter.license?.key ?? null}
          persona={session.persona}
        />
        <ImportMemorySection
          onRestore={(snapshot) => {
            session.replaceConversation(snapshot.messages, snapshot.memoryNote, snapshot.persona);
            if (snapshot.licenseKey) supporter.activate({ key: snapshot.licenseKey, expiresAt: null });
          }}
        />
        <EraseMemorySection
          hasConversation={session.messages.length > 0 || session.memoryNote.length > 0}
          onErase={session.eraseConversation}
        />
      </div>
    </Modal>
  );
}
