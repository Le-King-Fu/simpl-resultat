import { useTranslation } from "react-i18next";
import type { RecentTransaction } from "../../shared/types";

interface RecentTransactionsListProps {
  transactions: RecentTransaction[];
}

export default function RecentTransactionsList({ transactions }: RecentTransactionsListProps) {
  const { t } = useTranslation();

  if (transactions.length === 0) {
    return (
      <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
        <h2 className="text-lg font-semibold mb-4">{t("dashboard.recentTransactions")}</h2>
        <p className="text-center text-[var(--muted-foreground)] py-8">{t("dashboard.noData")}</p>
      </div>
    );
  }

  const fmt = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

  return (
    <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
      <h2 className="text-lg font-semibold mb-4">{t("dashboard.recentTransactions")}</h2>
      <div className="space-y-3">
        {transactions.map((tx) => (
          <div key={tx.id} className="flex items-center gap-3">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: tx.category_color ?? "#9ca3af" }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{tx.description}</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {tx.date}
                {tx.category_name ? ` · ${tx.category_name}` : ""}
              </p>
            </div>
            <span
              className={`text-sm font-medium flex-shrink-0 ${
                tx.amount >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
              }`}
            >
              {fmt.format(tx.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
