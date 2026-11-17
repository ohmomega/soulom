import type { PersonaId } from "../../config/personas";
import { useState, type FormEvent } from "react";
import {
  buildSoulomFileName,
  createQuickSave,
  createVaultLock,
  downloadTextFile,
  type MemorySnapshot,
} from "../../lib/soulomFile";
import type { ChatMessage } from "../../types/chat";
import { useI18n } from "../../i18n/I18nProvider";
import { Button, StatusLine, TextField } from "../ui";

const MIN_PASSWORD_LENGTH = 4;

interface ExportMemorySectionProps {
  messages: ChatMessage[];
  memoryNote: string;
  licenseKey: string | null;
  persona: PersonaId;
}

type ExportMode = "quick" | "vault";

export function ExportMemorySection({ messages, memoryNote, licenseKey, persona }: ExportMemorySectionProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<ExportMode>("quick");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [hint, setHint] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [status, setStatus] = useState<{ tone: "calm" | "warn"; text: string } | null>(null);

  const isEmpty = messages.length === 0 && !memoryNote && !licenseKey;
  const passwordProblem =
    mode !== "vault"
      ? null
      : password.length < MIN_PASSWORD_LENGTH
        ? t.exportMemory.tooShort(MIN_PASSWORD_LENGTH)
        : password !== passwordConfirmation
          ? t.exportMemory.mismatch
          : null;

  const exportMemory = async (event: FormEvent) => {
    event.preventDefault();
    if (isEmpty || passwordProblem) return;

    const snapshot: MemorySnapshot = {
      exportedAt: new Date().toISOString(),
      messages,
      memoryNote,
      licenseKey,
      persona,
    };
    setIsWorking(true);
    setStatus(null);
    try {
      const fileContents =
        mode === "quick" ? await createQuickSave(snapshot) : await createVaultLock(snapshot, password, hint);
      downloadTextFile(buildSoulomFileName(), fileContents);
      setStatus({ tone: "calm", text: t.exportMemory.done(messages.length) });
      setPassword("");
      setPasswordConfirmation("");
    } catch {
      setStatus({ tone: "warn", text: t.exportMemory.failed });
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <section aria-labelledby="export-heading">
      <h3 id="export-heading" className="text-sm font-medium text-cream">
        {t.exportMemory.heading}
      </h3>

      <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label={t.exportMemory.modesAria}>
        {(
          [
            { id: "quick", title: t.exportMemory.quickTitle, detail: t.exportMemory.quickDetail },
            { id: "vault", title: t.exportMemory.vaultTitle, detail: t.exportMemory.vaultDetail },
          ] as const
        ).map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={mode === option.id}
            onClick={() => setMode(option.id)}
            className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
              mode === option.id ? "border-ember/70 bg-night" : "border-line hover:border-line-strong"
            }`}
          >
            <span className="block text-sm font-medium text-cream">{option.title}</span>
            <span className="block text-xs text-muted">{option.detail}</span>
          </button>
        ))}
      </div>

      <form onSubmit={exportMemory} className="mt-3 space-y-2.5">
        {mode === "quick" && (
          <p className="text-xs leading-relaxed text-muted">
            {t.exportMemory.quickWarning}
          </p>
        )}
        {mode === "vault" && (
          <>
            <TextField
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t.exportMemory.passwordPlaceholder}
              autoComplete="new-password"
              aria-label={t.exportMemory.passwordAria}
            />
            <TextField
              type="password"
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              placeholder={t.exportMemory.confirmPlaceholder}
              autoComplete="new-password"
              aria-label={t.exportMemory.confirmAria}
            />
            <TextField
              value={hint}
              onChange={(event) => setHint(event.target.value)}
              placeholder={t.exportMemory.hintPlaceholder}
              maxLength={120}
              aria-label={t.exportMemory.hintAria}
            />
            <p className="text-xs leading-relaxed text-muted">
              {t.exportMemory.vaultNote}
            </p>
          </>
        )}

        <Button
          type="submit"
          tone="primary"
          className="w-full"
          disabled={isWorking || isEmpty || (mode === "vault" && passwordProblem !== null)}
        >
          {isWorking ? t.exportMemory.working : t.exportMemory.submit}
        </Button>
        {mode === "vault" && password.length > 0 && passwordProblem && (
          <StatusLine tone="warn">{passwordProblem}</StatusLine>
        )}
        {isEmpty && <p className="text-xs text-muted">{t.exportMemory.empty}</p>}
        {status && <StatusLine tone={status.tone}>{status.text}</StatusLine>}
      </form>
    </section>
  );
}
