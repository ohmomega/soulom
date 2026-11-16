import { useState, type FormEvent } from "react";
import type { SupporterLicense } from "../../hooks/useSupporterLicense";
import { checkLicense } from "../../lib/soulomApi";
import { Button, StatusLine, TextField } from "../ui";

const INVALID_REASON_COPY: Record<string, string> = {
  expired: "รหัสนี้หมดอายุแล้ว",
  malformed: "รูปแบบรหัสไม่ถูกต้อง",
  unknown: "ไม่พบรหัสนี้ในระบบ",
  unavailable: "ระบบตรวจรหัสไม่ตอบสนอง ลองใหม่อีกสักครู่",
  too_many_attempts: "ลองกรอกรหัสหลายครั้งเกินไปในวันนี้",
};

function maskLicenseKey(licenseKey: string): string {
  return licenseKey.length <= 8 ? licenseKey : `${licenseKey.slice(0, 10)}••••${licenseKey.slice(-4)}`;
}

export function RedeemCodeSection({ supporter }: { supporter: SupporterLicense }) {
  const [draftKey, setDraftKey] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const redeem = async (event: FormEvent) => {
    event.preventDefault();
    const candidate = draftKey.trim();
    if (!candidate) return;

    setIsChecking(true);
    setFeedback(null);
    const outcome = await checkLicense(candidate);
    setIsChecking(false);

    if (outcome.kind === "valid") {
      supporter.activate({ key: outcome.licenseKey, expiresAt: outcome.expiresAt });
      setDraftKey("");
      return;
    }
    setFeedback(
      outcome.kind === "invalid"
        ? (INVALID_REASON_COPY[outcome.reason] ?? INVALID_REASON_COPY.unknown!)
        : "เชื่อมต่อไม่ได้ ลองใหม่อีกครั้ง",
    );
  };

  const { license, health } = supporter;

  return (
    <section className="border-t border-line pt-5" aria-labelledby="redeem-heading">
      <h3 id="redeem-heading" className="text-sm font-medium text-cream">
        มีรหัสปลดล็อกแล้ว
      </h3>

      {license && health === "active" && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-night px-4 py-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm text-sage">
              <span className="size-1.5 rounded-full bg-sage" />
              Supporter Active
            </p>
            <p className="mt-0.5 truncate font-mono text-xs text-muted">
              {maskLicenseKey(license.key)}
              {license.expiresAt &&
                ` · ถึง ${new Date(license.expiresAt).toLocaleDateString("th-TH", { dateStyle: "medium" })}`}
            </p>
          </div>
          <button type="button" onClick={supporter.forget} className="shrink-0 text-xs text-muted hover:text-clay">
            นำรหัสออก
          </button>
        </div>
      )}

      {license && health === "rejected" && (
        <div className="mt-3">
          <StatusLine tone="warn">รหัส {maskLicenseKey(license.key)} ใช้ไม่ได้แล้ว (อาจหมดอายุ) ตอนนี้กลับมาใช้โควตาฟรี</StatusLine>
          <button type="button" onClick={supporter.forget} className="mt-1 text-xs text-muted hover:text-cream">
            นำรหัสออก
          </button>
        </div>
      )}

      {(!license || health !== "active") && (
        <form onSubmit={redeem} className="mt-3 flex gap-2">
          <TextField
            value={draftKey}
            onChange={(event) => setDraftKey(event.target.value)}
            placeholder="SOULOM-TH-… หรือ License Key"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={128}
            aria-label="รหัสปลดล็อก"
          />
          <Button type="submit" tone="primary" disabled={isChecking || !draftKey.trim()} className="shrink-0">
            {isChecking ? "กำลังตรวจ…" : "ยืนยัน"}
          </Button>
        </form>
      )}

      {feedback && (
        <div className="mt-2">
          <StatusLine tone="warn">{feedback}</StatusLine>
        </div>
      )}
    </section>
  );
}
