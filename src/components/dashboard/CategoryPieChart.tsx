import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Eye } from "lucide-react";
import type { CategoryBreakdownItem } from "../../shared/types";
import { ChartPatternDefs, getPatternFill, PatternSwatch } from "../../utils/chartPatterns";
import ChartContextMenu from "../shared/ChartContextMenu";

interface CategoryPieChartProps {
  data: CategoryBreakdownItem[];
  hiddenCategories: Set<string>;
  onToggleHidden: (categoryName: string) => void;
  onShowAll: () => void;
  onViewDetails: (item: CategoryBreakdownItem) => void;
}

export default function CategoryPieChart({
  data,
  hiddenCategories,
  onToggleHidden,
  onShowAll,
  onViewDetails,
}: CategoryPieChartProps) {
  const { t } = useTranslation();
  const hoveredRef = useRef<CategoryBreakdownItem | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: CategoryBreakdownItem } | null>(null);

  const visibleData = data.filter((d) => !hiddenCategories.has(d.category_name));
  const total = visibleData.reduce((sum, d) => sum + d.total, 0);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!hoveredRef.current) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item: hoveredRef.current });
  }, []);

  if (data.length === 0) {
    return (
      <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
        <h2 className="text-lg font-semibold mb-4">{t("dashboard.expensesByCategory")}</h2>
        <p className="text-center text-[var(--muted-foreground)] py-8">{t("dashboard.noData")}</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
      <h2 className="text-lg font-semibold mb-4">{t("dashboard.expensesByCategory")}</h2>

      {hiddenCategories.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
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
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <ChartPatternDefs
              prefix="cat-pie"
              categories={visibleData.map((item, index) => ({ color: item.category_color, index }))}
            />
            <Pie
              data={visibleData}
              dataKey="total"
              nameKey="category_name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={100}
              paddingAngle={2}
            >
              {visibleData.map((item, index) => (
                <Cell
                  key={index}
                  fill={getPatternFill("cat-pie", index, item.category_color)}
                  onMouseEnter={() => { hoveredRef.current = item; }}
                  onMouseLeave={() => { hoveredRef.current = null; }}
                  cursor="context-menu"
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) =>
                new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(Number(value))
              }
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                color: "var(--foreground)",
              }}
              labelStyle={{ color: "var(--foreground)" }}
              itemStyle={{ color: "var(--foreground)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {data.map((item, index) => {
          const isHidden = hiddenCategories.has(item.category_name);
          return (
            <button
              key={index}
              className={`flex items-center gap-1.5 text-sm ${isHidden ? "opacity-40" : ""}`}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, item });
              }}
              onClick={() => isHidden ? onToggleHidden(item.category_name) : undefined}
              title={isHidden ? t("charts.clickToShow") : undefined}
            >
              <PatternSwatch index={index} color={item.category_color} prefix="cat-pie" />
              <span className="text-[var(--muted-foreground)]">
                {item.category_name} {total > 0 && !isHidden ? `${Math.round((item.total / total) * 100)}%` : ""}
              </span>
            </button>
          );
        })}
      </div>

      {contextMenu && (
        <ChartContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          categoryName={contextMenu.item.category_name}
          onHide={() => onToggleHidden(contextMenu.item.category_name)}
          onViewDetails={() => onViewDetails(contextMenu.item)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
