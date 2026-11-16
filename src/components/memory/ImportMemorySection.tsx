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
import { Button, StatusLine, TextField } from "../ui";

const FILE_ERROR_COPY: Record<SoulomFileError["code"], string> = {
  unreadable: "ไฟล์นี้ไม่ใช่ไฟล์ .soulom",
  unsupported: "ไฟล์นี้มาจาก Soulom เวอร์ชันที่ไม่รองรับ",
  corrupted: "ไฟล์เสียหายหรือถูกแก้ไข จึงไม่กู้คืนเพื่อความปลอดภัย",
  "wrong-password": "รหัสผ่านไม่ถูกต้อง",
  "too-large": "ไฟล์ใหญ่เกินไป",
};

type ImportStage =
  | { step: "idle" }
  | { step: "locked"; envelope: Extract<SoulomEnvelope, { mode: "vault" }> }
  | { step: "preview"; snapshot: MemorySnapshot }
  | { step: "restored"; messageCount: number };

function describeError(error: unknown): string {
  return error instanceof SoulomFileError ? FILE_ERROR_COPY[error.code] : "เปิดไฟล์ไม่สำเร็จ";
}

export function ImportMemorySection({ onRestore }: { onRestore: (snapshot: MemorySnapshot) => void }) {
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
      setError(FILE_ERROR_COPY["too-large"]);
      return;
    }

    try {
      const envelope = parseEnvelope(await file.text());
      setStage(envelope.mode === "vault" ? { step: "locked", envelope } : { step: "preview", snapshot: openQuickSave(envelope) });
    } catch (fileError) {
      setStage({ step: "idle" });
      setError(describeError(fileError));
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
      setError(describeError(unlockError));
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
        กู้คืนความทรงจำ
      </h3>

      {(stage.step === "idle" || stage.step === "restored") && (
        <label className="mt-3 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-line-strong px-4 py-3 text-sm text-cream-soft transition-colors hover:border-ember">
          <input type="file" accept=".soulom,application/json,application/octet-stream" className="sr-only" onChange={handleFileSelected} />
          เลือกไฟล์ .soulom
        </label>
      )}

      {stage.step === "locked" && (
        <form onSubmit={unlock} className="mt-3 space-y-2.5">
          <p className="text-sm text-cream-soft">ไฟล์นี้ล็อกด้วย Vault Lock</p>
          {stage.envelope.hint && (
            <p className="rounded-xl bg-night px-4 py-2.5 text-sm break-words whitespace-pre-wrap text-muted">
              คำใบ้: {stage.envelope.hint}
            </p>
          )}
          <TextField
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="รหัสผ่านหรือ PIN"
            autoComplete="current-password"
            aria-label="รหัสผ่านไฟล์"
            autoFocus
          />
          <div className="flex gap-2">
            <Button onClick={() => setStage({ step: "idle" })}>ยกเลิก</Button>
            <Button type="submit" tone="primary" className="flex-1" disabled={isUnlocking || !password}>
              {isUnlocking ? "กำลังปลดล็อก…" : "ปลดล็อก"}
            </Button>
          </div>
        </form>
      )}

      {stage.step === "preview" && (
        <div className="mt-3 space-y-3">
          <div className="rounded-2xl bg-night px-4 py-3 text-sm text-cream-soft">
            <p>
              {stage.snapshot.messages.length} ข้อความ · เก็บเมื่อ{" "}
              {new Date(stage.snapshot.exportedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
            </p>
            {stage.snapshot.messages.at(-1) && (
              <p className="mt-1.5 line-clamp-2 break-words whitespace-pre-wrap text-muted">
                “{stage.snapshot.messages.at(-1)!.text}”
              </p>
            )}
            {stage.snapshot.licenseKey && <p className="mt-1.5 text-xs text-sage">มีรหัสผู้สนับสนุนแนบมาด้วย</p>}
          </div>
          <p className="text-xs text-muted">การกู้คืนจะแทนที่บทสนทนาที่อยู่ในเครื่องนี้ตอนนี้ทั้งหมด</p>
          <div className="flex gap-2">
            <Button onClick={() => setStage({ step: "idle" })}>ยกเลิก</Button>
            <Button tone="primary" className="flex-1" onClick={confirmRestore}>
              กู้คืน
            </Button>
          </div>
        </div>
      )}

      {stage.step === "restored" && (
        <div className="mt-2">
          <StatusLine tone="calm">กู้คืน {stage.messageCount} ข้อความเรียบร้อยแล้ว</StatusLine>
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
