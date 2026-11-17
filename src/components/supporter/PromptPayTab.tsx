import { useState, type ChangeEvent } from "react";
import { submitPaymentSlip, type SlipOutcome } from "../../lib/soulomApi";
import type { StoredLicense } from "../../types/chat";
import { CopyIcon } from "../icons";
import { useI18n } from "../../i18n/I18nProvider";
import type { Strings } from "../../i18n/strings";
import { Button, StatusLine } from "../ui";

const MAX_SLIP_BYTES = 5 * 1024 * 1024;

function describeRejection(outcome: Extract<SlipOutcome, { kind: "rejected" }>, t: Strings): string {
  if (outcome.code === "slip_amount_too_low") {
    return t.promptPay.minAmount(String(outcome.minimumAmount ?? ""));
  }
  return t.promptPay.rejections[outcome.code] ?? t.promptPay.genericReject;
}

export function PromptPayTab({ onLicenseIssued }: { onLicenseIssued: (license: StoredLicense) => void }) {
  const { t } = useI18n();
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
      <p>{t.promptPay.body}</p>

      {isQrAvailable ? (
        <img
          src="/promptpay-qr.png"
          alt={t.promptPay.qrAlt}
          onError={() => setIsQrAvailable(false)}
          className="mx-auto aspect-square w-full max-w-60 rounded-2xl bg-cream object-contain p-3"
        />
      ) : (
        <p className="rounded-xl border border-line px-4 py-3 text-muted">{t.promptPay.qrMissing}</p>
      )}

      <label
        className={`flex w-full items-center justify-center rounded-xl border border-dashed border-line-strong px-4 py-3.5 text-cream transition-colors hover:border-ember ${
          isVerifying ? "pointer-events-none opacity-60" : "cursor-pointer"
        }`}
      >
        <input type="file" accept="image/*" className="sr-only" onChange={handleSlipSelected} disabled={isVerifying} />
        {isVerifying ? t.promptPay.verifying : t.promptPay.upload}
      </label>

      {outcome?.kind === "rejected" && <StatusLine tone="warn">{describeRejection(outcome, t)}</StatusLine>}

      {outcome?.kind === "issued" && (
        <div className="animate-settle space-y-2 rounded-2xl border border-sage/40 bg-night px-4 py-3.5">
          <p className="text-sage">{t.promptPay.thanks}</p>
          <div className="flex items-center justify-between gap-3">
            <code className="font-mono text-[13px] tracking-wide break-all text-cream select-all">{outcome.licenseKey}</code>
            <Button onClick={() => copyIssuedKey(outcome.licenseKey)} className="shrink-0 px-3 py-1.5" aria-label={t.promptPay.copyAria}>
              <CopyIcon width={16} height={16} />
              {isCopied ? t.promptPay.copied : t.promptPay.copy}
            </Button>
          </div>
          <p className="text-xs text-muted">
            {t.promptPay.validUntil(new Date(outcome.expiresAt).toLocaleDateString(t.locale, { dateStyle: "long" }))}
          </p>
        </div>
      )}
    </div>
  );
}
