import { useTranslation } from "react-i18next";

export default function TransactionsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("transactions.title")}</h1>
      <div className="bg-[var(--card)] rounded-xl p-8 border border-[var(--border)] text-center text-[var(--muted-foreground)]">
        <p>{t("transactions.noTransactions")}</p>
      </div>
    </div>
  );
}
