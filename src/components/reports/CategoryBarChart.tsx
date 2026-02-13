import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { CategoryBreakdownItem } from "../../shared/types";

const cadFormatter = (value: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(value);

interface CategoryBarChartProps {
  data: CategoryBreakdownItem[];
}

export default function CategoryBarChart({ data }: CategoryBarChartProps) {
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
      <ResponsiveContainer width="100%" height={Math.max(400, data.length * 40)}>
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
          <XAxis
            type="number"
            tickFormatter={(v) => cadFormatter(v)}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            stroke="var(--border)"
          />
          <YAxis
            type="category"
            dataKey="category_name"
            width={120}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            stroke="var(--border)"
          />
          <Tooltip
            formatter={(value: number | undefined) => cadFormatter(value ?? 0)}
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--foreground)",
            }}
            labelStyle={{ color: "var(--foreground)" }}
            itemStyle={{ color: "var(--foreground)" }}
          />
          <Bar dataKey="total" name={t("dashboard.expenses")} radius={[0, 4, 4, 0]}>
            {data.map((item, index) => (
              <Cell key={index} fill={item.category_color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
