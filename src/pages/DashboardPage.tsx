import { useTranslation } from "react-i18next";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

export default function DashboardPage() {
  const { t } = useTranslation();

  const cards = [
    {
      labelKey: "dashboard.balance",
      value: "0,00 €",
      icon: Wallet,
      color: "text-[var(--primary)]",
    },
    {
      labelKey: "dashboard.income",
      value: "0,00 €",
      icon: TrendingUp,
      color: "text-[var(--positive)]",
    },
    {
      labelKey: "dashboard.expenses",
      value: "0,00 €",
      icon: TrendingDown,
      color: "text-[var(--negative)]",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("dashboard.title")}</h1>

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

      <div className="bg-[var(--card)] rounded-xl p-8 border border-[var(--border)] text-center text-[var(--muted-foreground)]">
        <p>{t("dashboard.noData")}</p>
      </div>
    </div>
  );
}
