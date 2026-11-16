import { supportLinks } from "../../config/supportLinks";
import { LinkButton } from "../ui";

export function CardPaymentTab() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-cream-soft">
      <p>
        ชำระด้วยบัตรเครดิตหรือเดบิตจากทุกประเทศผ่าน Lemon Squeezy หลังชำระเสร็จ คุณจะได้รับ License Key ทางอีเมล
        นำมากรอกในช่องด้านล่างเพื่อคุยได้ไม่จำกัด
      </p>
      {supportLinks.lemonSqueezyUrl ? (
        <LinkButton href={supportLinks.lemonSqueezyUrl}>ไปหน้าชำระเงิน</LinkButton>
      ) : (
        <p className="rounded-xl border border-line px-4 py-3 text-muted">ช่องทางนี้ยังไม่เปิดใช้งาน</p>
      )}
    </div>
  );
}
