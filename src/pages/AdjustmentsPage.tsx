import { useTranslation } from "react-i18next";
import { PageHelp } from "../components/shared/PageHelp";

export default function AdjustmentsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="relative flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">{t("adjustments.title")}</h1>
        <PageHelp helpKey="adjustments" />
      </div>
      <div className="bg-[var(--card)] rounded-xl p-8 border border-[var(--border)] text-center text-[var(--muted-foreground)]">
        <p>{t("common.noResults")}</p>
      </div>
    </div>
  );
}
