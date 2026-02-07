import { useTranslation } from "react-i18next";

export default function BudgetPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("budget.title")}</h1>
      <div className="bg-[var(--card)] rounded-xl p-8 border border-[var(--border)] text-center text-[var(--muted-foreground)]">
        <p>{t("common.noResults")}</p>
      </div>
    </div>
  );
}
