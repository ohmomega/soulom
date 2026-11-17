import { useState, type FormEvent } from "react";
import type { SupporterLicense } from "../../hooks/useSupporterLicense";
import { checkLicense } from "../../lib/soulomApi";
import { useI18n } from "../../i18n/I18nProvider";
import { Button, StatusLine, TextField } from "../ui";

function maskLicenseKey(licenseKey: string): string {
  return licenseKey.length <= 8 ? licenseKey : `${licenseKey.slice(0, 10)}••••${licenseKey.slice(-4)}`;
}

export function RedeemCodeSection({ supporter }: { supporter: SupporterLicense }) {
  const { t } = useI18n();
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
        ? (t.redeem.reasons[outcome.reason] ?? t.redeem.reasons.unknown!)
        : t.redeem.connectFail,
    );
  };

  const { license, health } = supporter;

  return (
    <section className="border-t border-line pt-5" aria-labelledby="redeem-heading">
      <h3 id="redeem-heading" className="text-sm font-medium text-cream">
        {t.redeem.heading}
      </h3>

      {license && health === "active" && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-night px-4 py-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm text-sage">
              <span className="size-1.5 rounded-full bg-sage" />
              {t.redeem.active}
            </p>
            <p className="mt-0.5 truncate font-mono text-xs text-muted">
              {maskLicenseKey(license.key)}
              {license.expiresAt &&
                t.redeem.until(new Date(license.expiresAt).toLocaleDateString(t.locale, { dateStyle: "medium" }))}
            </p>
          </div>
          <button type="button" onClick={supporter.forget} className="shrink-0 text-xs text-muted hover:text-clay">
            {t.redeem.remove}
          </button>
        </div>
      )}

      {license && health === "rejected" && (
        <div className="mt-3">
          <StatusLine tone="warn">{t.redeem.rejected(maskLicenseKey(license.key))}</StatusLine>
          <button type="button" onClick={supporter.forget} className="mt-1 text-xs text-muted hover:text-cream">
            {t.redeem.remove}
          </button>
        </div>
      )}

      {(!license || health !== "active") && (
        <form onSubmit={redeem} className="mt-3 flex gap-2">
          <TextField
            value={draftKey}
            onChange={(event) => setDraftKey(event.target.value)}
            placeholder={t.redeem.placeholder}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={128}
            aria-label={t.redeem.aria}
          />
          <Button type="submit" tone="primary" disabled={isChecking || !draftKey.trim()} className="shrink-0">
            {isChecking ? t.redeem.checking : t.redeem.confirm}
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
