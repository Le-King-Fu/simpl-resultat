import { useTranslation } from "react-i18next";
import { Target, Receipt, TrendingUp, TrendingDown } from "lucide-react";
import type { BudgetRow } from "../../shared/types";

const fmt = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

interface BudgetSummaryCardsProps {
  rows: BudgetRow[];
}

export default function BudgetSummaryCards({ rows }: BudgetSummaryCardsProps) {
  const { t } = useTranslation();

  const totalPlanned = rows.reduce((sum, r) => sum + r.planned, 0);
  const totalActual = rows.reduce((sum, r) => sum + Math.abs(r.actual), 0);
  const totalDifference = totalPlanned - totalActual;

  const DiffIcon = totalDifference >= 0 ? TrendingUp : TrendingDown;
  const diffColor = totalDifference >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]";

  const cards = [
    {
      labelKey: "budget.totalPlanned",
      value: fmt.format(totalPlanned),
      icon: Target,
      color: "text-[var(--primary)]",
    },
    {
      labelKey: "budget.totalActual",
      value: fmt.format(totalActual),
      icon: Receipt,
      color: "text-[var(--muted-foreground)]",
    },
    {
      labelKey: "budget.totalDifference",
      value: fmt.format(totalDifference),
      icon: DiffIcon,
      color: diffColor,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.labelKey}
          className="bg-[var(--card)] rounded-xl p-5 border border-[var(--border)] shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[var(--muted-foreground)]">{t(card.labelKey)}</span>
            <card.icon size={20} className={card.color} />
          </div>
          <p className="text-2xl font-semibold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
