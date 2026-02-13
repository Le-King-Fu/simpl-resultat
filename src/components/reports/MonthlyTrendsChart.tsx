import { useTranslation } from "react-i18next";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { MonthlyTrendItem } from "../../shared/types";

const cadFormatter = (value: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(value);

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString("default", { month: "short", year: "2-digit" });
}

interface MonthlyTrendsChartProps {
  data: MonthlyTrendItem[];
}

export default function MonthlyTrendsChart({ data }: MonthlyTrendsChartProps) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
        <p className="text-center text-[var(--muted-foreground)] py-8">{t("dashboard.noData")}</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="gradientIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--positive)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--positive)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradientExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--negative)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--negative)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            stroke="var(--border)"
          />
          <YAxis
            tickFormatter={(v) => cadFormatter(v)}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            stroke="var(--border)"
            width={80}
          />
          <Tooltip
            formatter={(value: number | undefined) => cadFormatter(value ?? 0)}
            labelFormatter={(label) => formatMonth(String(label))}
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--foreground)",
            }}
            labelStyle={{ color: "var(--foreground)" }}
            itemStyle={{ color: "var(--foreground)" }}
          />
          <Area
            type="monotone"
            dataKey="income"
            name={t("dashboard.income")}
            stroke="var(--positive)"
            fill="url(#gradientIncome)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="expenses"
            name={t("dashboard.expenses")}
            stroke="var(--negative)"
            fill="url(#gradientExpenses)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
