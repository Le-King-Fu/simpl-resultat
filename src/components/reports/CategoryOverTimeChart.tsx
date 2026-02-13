import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import type { CategoryOverTimeData } from "../../shared/types";

const cadFormatter = (value: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(value);

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString("default", { month: "short", year: "2-digit" });
}

interface CategoryOverTimeChartProps {
  data: CategoryOverTimeData;
}

export default function CategoryOverTimeChart({ data }: CategoryOverTimeChartProps) {
  const { t } = useTranslation();

  if (data.data.length === 0) {
    return (
      <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
        <p className="text-center text-[var(--muted-foreground)] py-8">{t("dashboard.noData")}</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data.data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
          <Legend />
          {data.categories.map((name) => (
            <Bar
              key={name}
              dataKey={name}
              stackId="stack"
              fill={data.colors[name]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
