import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  MAX_SOULOM_FILE_BYTES,
  openQuickSave,
  openVaultLock,
  parseEnvelope,
  SoulomFileError,
  type MemorySnapshot,
  type SoulomEnvelope,
} from "../../lib/soulomFile";
import { useI18n } from "../../i18n/I18nProvider";
import type { Strings } from "../../i18n/strings";
import { Button, StatusLine, TextField } from "../ui";

type ImportStage =
  | { step: "idle" }
  | { step: "locked"; envelope: Extract<SoulomEnvelope, { mode: "vault" }> }
  | { step: "preview"; snapshot: MemorySnapshot }
  | { step: "restored"; messageCount: number };

function describeError(error: unknown, t: Strings): string {
  return error instanceof SoulomFileError ? t.importMemory.errors[error.code] : t.importMemory.genericError;
}

export function ImportMemorySection({ onRestore }: { onRestore: (snapshot: MemorySnapshot) => void }) {
  const { t } = useI18n();
  const [stage, setStage] = useState<ImportStage>({ step: "idle" });
  const [password, setPassword] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    setPassword("");

    if (file.size > MAX_SOULOM_FILE_BYTES) {
      setError(t.importMemory.errors["too-large"]);
      return;
    }

    try {
      const envelope = parseEnvelope(await file.text());
      setStage(envelope.mode === "vault" ? { step: "locked", envelope } : { step: "preview", snapshot: openQuickSave(envelope) });
    } catch (fileError) {
      setStage({ step: "idle" });
      setError(describeError(fileError, t));
    }
  };

  const unlock = async (event: FormEvent) => {
    event.preventDefault();
    if (stage.step !== "locked" || !password) return;
    setIsUnlocking(true);
    setError(null);
    try {
      setStage({ step: "preview", snapshot: await openVaultLock(stage.envelope, password) });
      setPassword("");
    } catch (unlockError) {
      setError(describeError(unlockError, t));
    } finally {
      setIsUnlocking(false);
    }
  };

  const confirmRestore = () => {
    if (stage.step !== "preview") return;
    onRestore(stage.snapshot);
    setStage({ step: "restored", messageCount: stage.snapshot.messages.length });
  };

  return (
    <section aria-labelledby="import-heading" className="border-t border-line pt-5">
      <h3 id="import-heading" className="text-sm font-medium text-cream">
        {t.importMemory.heading}
      </h3>

      {(stage.step === "idle" || stage.step === "restored") && (
        <label className="mt-3 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-line-strong px-4 py-3 text-sm text-cream-soft transition-colors hover:border-ember">
          <input type="file" accept=".soulom,application/json,application/octet-stream" className="sr-only" onChange={handleFileSelected} />
          {t.importMemory.choose}
        </label>
      )}

      {stage.step === "locked" && (
        <form onSubmit={unlock} className="mt-3 space-y-2.5">
          <p className="text-sm text-cream-soft">{t.importMemory.locked}</p>
          {stage.envelope.hint && (
            <p className="rounded-xl bg-night px-4 py-2.5 text-sm break-words whitespace-pre-wrap text-muted">
              {t.importMemory.hint(stage.envelope.hint)}
            </p>
          )}
          <TextField
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t.importMemory.passwordPlaceholder}
            autoComplete="current-password"
            aria-label={t.importMemory.passwordAria}
            autoFocus
          />
          <div className="flex gap-2">
            <Button onClick={() => setStage({ step: "idle" })}>{t.common.cancel}</Button>
            <Button type="submit" tone="primary" className="flex-1" disabled={isUnlocking || !password}>
              {isUnlocking ? t.importMemory.unlocking : t.importMemory.unlock}
            </Button>
          </div>
        </form>
      )}

      {stage.step === "preview" && (
        <div className="mt-3 space-y-3">
          <div className="rounded-2xl bg-night px-4 py-3 text-sm text-cream-soft">
            <p>
              {t.importMemory.summary(
                stage.snapshot.messages.length,
                new Date(stage.snapshot.exportedAt).toLocaleString(t.locale, { dateStyle: "medium", timeStyle: "short" }),
              )}
            </p>
            {stage.snapshot.messages.at(-1) && (
              <p className="mt-1.5 line-clamp-2 break-words whitespace-pre-wrap text-muted">
                “{stage.snapshot.messages.at(-1)!.text}”
              </p>
            )}
            {stage.snapshot.licenseKey && <p className="mt-1.5 text-xs text-sage">{t.importMemory.hasLicense}</p>}
          </div>
          <p className="text-xs text-muted">{t.importMemory.replaceWarning}</p>
          <div className="flex gap-2">
            <Button onClick={() => setStage({ step: "idle" })}>{t.common.cancel}</Button>
            <Button tone="primary" className="flex-1" onClick={confirmRestore}>
              {t.importMemory.restore}
            </Button>
          </div>
        </div>
      )}

      {stage.step === "restored" && (
        <div className="mt-2">
          <StatusLine tone="calm">{t.importMemory.restored(stage.messageCount)}</StatusLine>
        </div>
      )}
      {error && (
        <div className="mt-2">
          <StatusLine tone="warn">{error}</StatusLine>
        </div>
      )}
    </section>
  );
}
