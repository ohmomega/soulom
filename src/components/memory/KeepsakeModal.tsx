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
        <p className="rounded-xl bg-night/70 px-3 py-2.5 text-xs leading-relaxed text-muted">
          เครื่องนี้เก็บแชทล่าสุดไว้ {session.messages.length.toLocaleString("th-TH")} จาก{" "}
          {session.storedLimit.toLocaleString("th-TH")} ข้อความ ข้อความที่เก่ากว่านั้นจะถูกลบเองเพื่อไม่ให้เครื่องหนัก
          แต่ Soulom ยังจำเรื่องสำคัญไว้ในโน้ตความจำ ถ้าอยากเก็บทั้งหมด กดเก็บเป็นไฟล์ไว้ได้
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
