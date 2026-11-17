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
        ? `รหัสผ่านหรือ PIN ต้องมีอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัว`
        : password !== passwordConfirmation
          ? "รหัสผ่านสองช่องไม่ตรงกัน"
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
      setStatus({ tone: "calm", text: `เก็บ ${messages.length} ข้อความเรียบร้อยแล้ว` });
      setPassword("");
      setPasswordConfirmation("");
    } catch {
      setStatus({ tone: "warn", text: "สร้างไฟล์ไม่สำเร็จ ลองอีกครั้ง" });
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <section aria-labelledby="export-heading">
      <h3 id="export-heading" className="text-sm font-medium text-cream">
        เก็บความทรงจำ (.soulom)
      </h3>

      <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="รูปแบบการเก็บ">
        {(
          [
            { id: "quick", title: "Quick Save", detail: "กดเดียวได้ไฟล์เลย" },
            { id: "vault", title: "Vault Lock", detail: "ล็อกด้วยรหัสผ่าน" },
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
            ไฟล์ Quick Save เข้ารหัสแบบ Base64 เท่านั้น ใครได้ไฟล์ไปก็เปิดอ่านได้ ถ้าจะส่งต่อหรือเก็บบนคลาวด์ แนะนำ Vault Lock
          </p>
        )}
        {mode === "vault" && (
          <>
            <TextField
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="ตั้งรหัสผ่านหรือ PIN"
              autoComplete="new-password"
              aria-label="รหัสผ่าน"
            />
            <TextField
              type="password"
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              placeholder="พิมพ์รหัสอีกครั้ง"
              autoComplete="new-password"
              aria-label="ยืนยันรหัสผ่าน"
            />
            <TextField
              value={hint}
              onChange={(event) => setHint(event.target.value)}
              placeholder="คำใบ้ (ไม่บังคับ) — ใครเปิดไฟล์ก็เห็นคำใบ้นี้"
              maxLength={120}
              aria-label="คำใบ้รหัสผ่าน"
            />
            <p className="text-xs leading-relaxed text-muted">
              เข้ารหัสด้วย AES-GCM ในเครื่องคุณ ถ้าลืมรหัส จะไม่มีใครกู้ไฟล์นี้ได้ รวมถึงเราด้วย
            </p>
          </>
        )}

        <Button
          type="submit"
          tone="primary"
          className="w-full"
          disabled={isWorking || isEmpty || (mode === "vault" && passwordProblem !== null)}
        >
          {isWorking ? "กำลังเก็บ…" : "เก็บความทรงจำ (.soulom)"}
        </Button>
        {mode === "vault" && password.length > 0 && passwordProblem && (
          <StatusLine tone="warn">{passwordProblem}</StatusLine>
        )}
        {isEmpty && <p className="text-xs text-muted">ยังไม่มีอะไรให้เก็บ</p>}
        {status && <StatusLine tone={status.tone}>{status.text}</StatusLine>}
      </form>
    </section>
  );
}
