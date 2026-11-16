import type { ChatSession } from "../../hooks/useChatSession";
import type { SupporterLicense } from "../../hooks/useSupporterLicense";
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
  return (
    <Modal
      title="ความทรงจำ"
      subtitle="บทสนทนาอยู่ในเบราว์เซอร์นี้เท่านั้น เก็บเป็นไฟล์ .soulom ไว้ย้ายเครื่องหรือสำรองได้"
      onClose={onClose}
    >
      <div className="space-y-6 pb-2">
        <ExportMemorySection
          messages={session.messages}
          memoryNote={session.memoryNote}
          licenseKey={supporter.license?.key ?? null}
        />
        <ImportMemorySection
          onRestore={(snapshot) => {
            session.replaceConversation(snapshot.messages, snapshot.memoryNote);
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
