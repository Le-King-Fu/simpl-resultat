import { useTranslation } from "react-i18next";
import { Hash, TrendingUp, TrendingDown } from "lucide-react";

interface TransactionSummaryBarProps {
  totalCount: number;
  incomeTotal: number;
  expenseTotal: number;
}

export default function TransactionSummaryBar({
  totalCount,
  incomeTotal,
  expenseTotal,
}: TransactionSummaryBarProps) {
  const { t } = useTranslation();

  const stats = [
    {
      icon: Hash,
      label: t("transactions.summary.count"),
      value: totalCount.toLocaleString(),
      color: "text-[var(--foreground)]",
    },
    {
      icon: TrendingUp,
      label: t("transactions.summary.income"),
      value: incomeTotal.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      color: "text-[var(--positive)]",
    },
    {
      icon: TrendingDown,
      label: t("transactions.summary.expenses"),
      value: expenseTotal.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      color: "text-[var(--negative)]",
    },
  ];

  return (
    <div className="flex flex-wrap gap-4 mb-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 bg-[var(--card)] rounded-xl px-4 py-3 border border-[var(--border)] min-w-[160px]"
        >
          <stat.icon size={16} className={stat.color} />
          <div>
            <p className="text-xs text-[var(--muted-foreground)]">{stat.label}</p>
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
