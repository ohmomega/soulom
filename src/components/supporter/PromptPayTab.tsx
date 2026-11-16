import { useState, type ChangeEvent } from "react";
import { submitPaymentSlip, type SlipOutcome } from "../../lib/soulomApi";
import type { StoredLicense } from "../../types/chat";
import { CopyIcon } from "../icons";
import { Button, StatusLine } from "../ui";

const MAX_SLIP_BYTES = 5 * 1024 * 1024;

const REJECTION_COPY: Record<string, string> = {
  slip_already_used: "สลิปนี้เคยใช้รับรหัสไปแล้ว",
  slip_unreadable: "อ่านข้อมูลจากสลิปไม่ได้ ลองใช้รูปที่ชัดขึ้นและเห็น QR บนสลิปครบ",
  slip_wrong_receiver: "สลิปนี้ไม่ได้โอนเข้าบัญชีของ Soulom",
  slip_invalid_file: "ไฟล์ต้องเป็นรูปภาพขนาดไม่เกิน 5 MB",
  slip_missing: "ยังไม่ได้เลือกรูปสลิป",
  too_many_attempts: "ลองส่งสลิปหลายครั้งเกินไปในวันนี้ ลองใหม่พรุ่งนี้นะ",
  slip_verification_unavailable: "ระบบตรวจสลิปยังไม่เปิดใช้งาน",
  slip_service_unavailable: "ระบบตรวจสลิปไม่ตอบสนอง ลองใหม่อีกสักครู่",
  offline: "เชื่อมต่ออินเทอร์เน็ตไม่ได้",
};

function describeRejection(outcome: Extract<SlipOutcome, { kind: "rejected" }>): string {
  if (outcome.code === "slip_amount_too_low") {
    return `ยอดโอนขั้นต่ำสำหรับรับรหัสคือ ${outcome.minimumAmount ?? ""} บาท`;
  }
  return REJECTION_COPY[outcome.code] ?? "ตรวจสลิปไม่สำเร็จ ลองใหม่อีกครั้ง";
}

export function PromptPayTab({ onLicenseIssued }: { onLicenseIssued: (license: StoredLicense) => void }) {
  const [isQrAvailable, setIsQrAvailable] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [outcome, setOutcome] = useState<SlipOutcome | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleSlipSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const slipImage = event.target.files?.[0];
    event.target.value = "";
    if (!slipImage) return;
    if (!slipImage.type.startsWith("image/") || slipImage.size > MAX_SLIP_BYTES) {
      setOutcome({ kind: "rejected", code: "slip_invalid_file" });
      return;
    }

    setIsVerifying(true);
    setOutcome(null);
    const result = await submitPaymentSlip(slipImage);
    setIsVerifying(false);
    setOutcome(result);
    if (result.kind === "issued") {
      onLicenseIssued({ key: result.licenseKey, expiresAt: result.expiresAt });
    }
  };

  const copyIssuedKey = async (licenseKey: string) => {
    try {
      await navigator.clipboard.writeText(licenseKey);
      setIsCopied(true);
    } catch {
      setIsCopied(false);
    }
  };

  return (
    <div className="space-y-4 text-sm leading-relaxed text-cream-soft">
      <p>สแกนจ่ายผ่านแอปธนาคารไหนก็ได้ แล้วอัปโหลดสลิปเพื่อรับรหัสปลดล็อกใช้งานไม่จำกัด 30 วัน</p>

      {isQrAvailable ? (
        <img
          src="/promptpay-qr.png"
          alt="QR Code พร้อมเพย์สำหรับสนับสนุน Soulom"
          onError={() => setIsQrAvailable(false)}
          className="mx-auto aspect-square w-full max-w-60 rounded-2xl bg-cream object-contain p-3"
        />
      ) : (
        <p className="rounded-xl border border-line px-4 py-3 text-muted">ยังไม่ได้ตั้งค่า QR พร้อมเพย์</p>
      )}

      <label
        className={`flex w-full items-center justify-center rounded-xl border border-dashed border-line-strong px-4 py-3.5 text-cream transition-colors hover:border-ember ${
          isVerifying ? "pointer-events-none opacity-60" : "cursor-pointer"
        }`}
      >
        <input type="file" accept="image/*" className="sr-only" onChange={handleSlipSelected} disabled={isVerifying} />
        {isVerifying ? "กำลังตรวจสลิป…" : "อัปโหลดสลิปโอนเงิน"}
      </label>

      {outcome?.kind === "rejected" && <StatusLine tone="warn">{describeRejection(outcome)}</StatusLine>}

      {outcome?.kind === "issued" && (
        <div className="animate-settle space-y-2 rounded-2xl border border-sage/40 bg-night px-4 py-3.5">
          <p className="text-sage">ขอบคุณมากนะ ปลดล็อกให้เรียบร้อยแล้ว</p>
          <div className="flex items-center justify-between gap-3">
            <code className="font-mono text-[13px] tracking-wide break-all text-cream select-all">{outcome.licenseKey}</code>
            <Button onClick={() => copyIssuedKey(outcome.licenseKey)} className="shrink-0 px-3 py-1.5" aria-label="คัดลอกรหัส">
              <CopyIcon width={16} height={16} />
              {isCopied ? "คัดลอกแล้ว" : "คัดลอก"}
            </Button>
          </div>
          <p className="text-xs text-muted">
            ใช้ได้ถึง {new Date(outcome.expiresAt).toLocaleDateString("th-TH", { dateStyle: "long" })} · จดรหัสนี้เก็บไว้
            เผื่อเปลี่ยนเครื่อง
          </p>
        </div>
      )}
    </div>
  );
}
