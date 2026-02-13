import { useState, useRef, useCallback } from "react";
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
import { Eye } from "lucide-react";
import type { CategoryOverTimeData, CategoryBreakdownItem } from "../../shared/types";
import { ChartPatternDefs, getPatternFill } from "../../utils/chartPatterns";
import ChartContextMenu from "../shared/ChartContextMenu";

const cadFormatter = (value: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(value);

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString("default", { month: "short", year: "2-digit" });
}

interface CategoryOverTimeChartProps {
  data: CategoryOverTimeData;
  hiddenCategories: Set<string>;
  onToggleHidden: (categoryName: string) => void;
  onShowAll: () => void;
  onViewDetails: (item: CategoryBreakdownItem) => void;
}

export default function CategoryOverTimeChart({
  data,
  hiddenCategories,
  onToggleHidden,
  onShowAll,
  onViewDetails,
}: CategoryOverTimeChartProps) {
  const { t } = useTranslation();
  const hoveredRef = useRef<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; name: string } | null>(null);

  const visibleCategories = data.categories.filter((name) => !hiddenCategories.has(name));
  const categoryEntries = visibleCategories.map((name, index) => ({
    name,
    color: data.colors[name],
    index,
  }));

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!hoveredRef.current) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, name: hoveredRef.current });
  }, []);

  if (data.data.length === 0) {
    return (
      <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
        <p className="text-center text-[var(--muted-foreground)] py-8">{t("dashboard.noData")}</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
      {hiddenCategories.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-[var(--muted-foreground)]">{t("charts.hiddenCategories")}:</span>
          {Array.from(hiddenCategories).map((name) => (
            <button
              key={name}
              onClick={() => onToggleHidden(name)}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--border)] transition-colors"
            >
              <Eye size={12} />
              {name}
            </button>
          ))}
          <button
            onClick={onShowAll}
            className="text-xs text-[var(--primary)] hover:underline"
          >
            {t("charts.showAll")}
          </button>
        </div>
      )}

      <div onContextMenu={handleContextMenu}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data.data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <ChartPatternDefs
              prefix="cat-time"
              categories={categoryEntries.map((c) => ({ color: c.color, index: c.index }))}
            />
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
            {categoryEntries.map((c) => (
              <Bar
                key={c.name}
                dataKey={c.name}
                stackId="stack"
                fill={getPatternFill("cat-time", c.index, c.color)}
                onMouseEnter={() => { hoveredRef.current = c.name; }}
                onMouseLeave={() => { hoveredRef.current = null; }}
                cursor="context-menu"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {contextMenu && (
        <ChartContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          categoryName={contextMenu.name}
          onHide={() => onToggleHidden(contextMenu.name)}
          onViewDetails={() => {
            const color = data.colors[contextMenu.name] || "#9ca3af";
            const categoryId = data.categoryIds[contextMenu.name] ?? null;
            onViewDetails({
              category_id: categoryId,
              category_name: contextMenu.name,
              category_color: color,
              total: 0,
            });
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
