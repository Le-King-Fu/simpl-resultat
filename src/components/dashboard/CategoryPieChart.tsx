import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { CategoryBreakdownItem } from "../../shared/types";

interface CategoryPieChartProps {
  data: CategoryBreakdownItem[];
}

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
        <h2 className="text-lg font-semibold mb-4">{t("dashboard.expensesByCategory")}</h2>
        <p className="text-center text-[var(--muted-foreground)] py-8">{t("dashboard.noData")}</p>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
      <h2 className="text-lg font-semibold mb-4">{t("dashboard.expensesByCategory")}</h2>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="category_name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={100}
            paddingAngle={2}
          >
            {data.map((item, index) => (
              <Cell key={index} fill={item.category_color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) =>
              new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(value))
            }
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-1.5 text-sm">
            <span
              className="w-3 h-3 rounded-full inline-block flex-shrink-0"
              style={{ backgroundColor: item.category_color }}
            />
            <span className="text-[var(--muted-foreground)]">
              {item.category_name} {total > 0 ? `${Math.round((item.total / total) * 100)}%` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
