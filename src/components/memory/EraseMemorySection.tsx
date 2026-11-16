import { useState } from "react";
import { Button } from "../ui";

export function EraseMemorySection({ hasConversation, onErase }: { hasConversation: boolean; onErase: () => void }) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!hasConversation) return null;

  return (
    <section className="border-t border-line pt-5" aria-labelledby="erase-heading">
      <h3 id="erase-heading" className="text-sm font-medium text-cream">
        ลบความทรงจำในเครื่องนี้
      </h3>
      {isConfirming ? (
        <div className="mt-3 space-y-2.5">
          <p className="text-sm text-cream-soft">บทสนทนาและโน้ตความจำจะหายไปถาวร ถ้ายังไม่ได้เก็บไฟล์ไว้ จะกู้คืนไม่ได้</p>
          <div className="flex gap-2">
            <Button onClick={() => setIsConfirming(false)}>ยังก่อน</Button>
            <Button
              tone="danger"
              className="flex-1"
              onClick={() => {
                onErase();
                setIsConfirming(false);
              }}
            >
              ลบทั้งหมด
            </Button>
          </div>
        </div>
      ) : (
        <Button tone="danger" className="mt-3" onClick={() => setIsConfirming(true)}>
          เริ่มต้นใหม่
        </Button>
      )}
    </section>
  );
}
