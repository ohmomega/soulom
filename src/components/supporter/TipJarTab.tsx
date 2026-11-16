import { supportLinks } from "../../config/supportLinks";
import { LinkButton } from "../ui";

export function TipJarTab() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-cream-soft">
      <p>
        ถ้า Soulom เคยอยู่เป็นเพื่อนในคืนที่เหงา เลี้ยงกาแฟคนทำสักแก้วได้นะ ไม่มีสิทธิพิเศษอะไรผูกมัด
        เป็นแค่คำขอบคุณเงียบๆ
      </p>
      {supportLinks.kofiUrl ? (
        <LinkButton href={supportLinks.kofiUrl}>เลี้ยงกาแฟผ่าน Ko-fi</LinkButton>
      ) : (
        <p className="rounded-xl border border-line px-4 py-3 text-muted">ช่องทางนี้ยังไม่เปิดใช้งาน</p>
      )}
    </div>
  );
}
