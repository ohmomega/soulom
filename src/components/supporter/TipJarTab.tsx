import { supportLinks } from "../../config/supportLinks";
import { useI18n } from "../../i18n/I18nProvider";
import { LinkButton } from "../ui";

export function TipJarTab() {
  const { t } = useI18n();
  return (
    <div className="space-y-4 text-sm leading-relaxed text-cream-soft">
      <p>{t.supporter.tipBody}</p>
      {supportLinks.kofiUrl ? (
        <LinkButton href={supportLinks.kofiUrl}>{t.supporter.tipButton}</LinkButton>
      ) : (
        <p className="rounded-xl border border-line px-4 py-3 text-muted">{t.supporter.unavailable}</p>
      )}
    </div>
  );
}
