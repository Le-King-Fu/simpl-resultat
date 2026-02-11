import { useTranslation } from "react-i18next";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { useDashboard } from "../hooks/useDashboard";
import { PageHelp } from "../components/shared/PageHelp";
import PeriodSelector from "../components/dashboard/PeriodSelector";
import CategoryPieChart from "../components/dashboard/CategoryPieChart";
import RecentTransactionsList from "../components/dashboard/RecentTransactionsList";

const fmt = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

export default function DashboardPage() {
  const { t } = useTranslation();
  const { state, setPeriod } = useDashboard();
  const { summary, categoryBreakdown, recentTransactions, period, isLoading } = state;

  const balance = summary.totalAmount;
  const balanceColor =
    balance > 0
      ? "text-[var(--positive)]"
      : balance < 0
        ? "text-[var(--negative)]"
        : "text-[var(--primary)]";

  const cards = [
    {
      labelKey: "dashboard.balance",
      value: fmt.format(balance),
      icon: Wallet,
      color: balanceColor,
    },
    {
      labelKey: "dashboard.income",
      value: fmt.format(summary.incomeTotal),
      icon: TrendingUp,
      color: "text-[var(--positive)]",
    },
    {
      labelKey: "dashboard.expenses",
      value: fmt.format(Math.abs(summary.expenseTotal)),
      icon: TrendingDown,
      color: "text-[var(--negative)]",
    },
  ];

  return (
    <div className={isLoading ? "opacity-50 pointer-events-none" : ""}>
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
          <PageHelp helpKey="dashboard" />
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => (
          <div
            key={card.labelKey}
            className="bg-[var(--card)] rounded-xl p-5 border border-[var(--border)] shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--muted-foreground)]">
                {t(card.labelKey)}
              </span>
              <card.icon size={20} className={card.color} />
            </div>
            <p className="text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoryPieChart data={categoryBreakdown} />
        <RecentTransactionsList transactions={recentTransactions} />
      </div>
    </div>
  );
}
