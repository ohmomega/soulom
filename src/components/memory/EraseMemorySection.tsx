import { useState } from "react";
import { useI18n } from "../../i18n/I18nProvider";
import { Button } from "../ui";

export function EraseMemorySection({ hasConversation, onErase }: { hasConversation: boolean; onErase: () => void }) {
  const { t } = useI18n();
  const [isConfirming, setIsConfirming] = useState(false);

  if (!hasConversation) return null;

  return (
    <section className="border-t border-line pt-5" aria-labelledby="erase-heading">
      <h3 id="erase-heading" className="text-sm font-medium text-cream">
        {t.eraseMemory.heading}
      </h3>
      {isConfirming ? (
        <div className="mt-3 space-y-2.5">
          <p className="text-sm text-cream-soft">{t.eraseMemory.confirm}</p>
          <div className="flex gap-2">
            <Button onClick={() => setIsConfirming(false)}>{t.eraseMemory.notYet}</Button>
            <Button
              tone="danger"
              className="flex-1"
              onClick={() => {
                onErase();
                setIsConfirming(false);
              }}
            >
              {t.eraseMemory.eraseAll}
            </Button>
          </div>
        </div>
      ) : (
        <Button tone="danger" className="mt-3" onClick={() => setIsConfirming(true)}>
          {t.eraseMemory.startOver}
        </Button>
      )}
    </section>
  );
}
