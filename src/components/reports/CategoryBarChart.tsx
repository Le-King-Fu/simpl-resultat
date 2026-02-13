import { useState, useRef, useCallback } from "react";
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
import { Eye } from "lucide-react";
import type { CategoryBreakdownItem } from "../../shared/types";
import { ChartPatternDefs, getPatternFill } from "../../utils/chartPatterns";
import ChartContextMenu from "../shared/ChartContextMenu";

const cadFormatter = (value: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(value);

interface CategoryBarChartProps {
  data: CategoryBreakdownItem[];
  hiddenCategories: Set<string>;
  onToggleHidden: (categoryName: string) => void;
  onShowAll: () => void;
  onViewDetails: (item: CategoryBreakdownItem) => void;
}

export default function CategoryBarChart({
  data,
  hiddenCategories,
  onToggleHidden,
  onShowAll,
  onViewDetails,
}: CategoryBarChartProps) {
  const { t } = useTranslation();
  const hoveredRef = useRef<CategoryBreakdownItem | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: CategoryBreakdownItem } | null>(null);

  const visibleData = data.filter((d) => !hiddenCategories.has(d.category_name));

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!hoveredRef.current) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item: hoveredRef.current });
  }, []);

  if (data.length === 0) {
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
        <ResponsiveContainer width="100%" height={Math.max(400, visibleData.length * 40)}>
          <BarChart data={visibleData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
            <ChartPatternDefs
              prefix="cat-bar"
              categories={visibleData.map((item, index) => ({ color: item.category_color, index }))}
            />
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
              {visibleData.map((item, index) => (
                <Cell
                  key={index}
                  fill={getPatternFill("cat-bar", index, item.category_color)}
                  onMouseEnter={() => { hoveredRef.current = item; }}
                  onMouseLeave={() => { hoveredRef.current = null; }}
                  cursor="context-menu"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
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
