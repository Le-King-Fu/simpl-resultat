import { useMemo } from "react";
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
import type { PivotConfig, PivotResult } from "../../shared/types";
import { ChartPatternDefs, getPatternFill } from "../../utils/chartPatterns";

const cadFormatter = (value: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(value);

// Generate distinct colors for series
const SERIES_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16",
  "#d946ef", "#0ea5e9", "#eab308", "#22c55e", "#e11d48",
];

interface DynamicReportChartProps {
  config: PivotConfig;
  result: PivotResult;
}

export default function DynamicReportChart({ config, result }: DynamicReportChartProps) {
  const { t } = useTranslation();

  const { chartData, seriesKeys, seriesColors } = useMemo(() => {
    if (result.rows.length === 0) {
      return { chartData: [], seriesKeys: [], seriesColors: {} };
    }

    const colDim = config.columns[0];
    const rowDim = config.rows[0];
    const measure = config.values[0] || "periodic";

    // X-axis = first column dimension (or first row dimension if no columns)
    const xDim = colDim || rowDim;
    if (!xDim) return { chartData: [], seriesKeys: [], seriesColors: {} };

    // Series = first row dimension (or no stacking if no rows, or first row if columns exist)
    const seriesDim = colDim ? rowDim : undefined;

    // Collect unique x and series values
    const xValues = [...new Set(result.rows.map((r) => r.keys[xDim]))].sort();
    const seriesVals = seriesDim
      ? [...new Set(result.rows.map((r) => r.keys[seriesDim]))].sort()
      : [measure];

    // Build chart data: one entry per x value
    const data = xValues.map((xVal) => {
      const entry: Record<string, string | number> = { name: xVal };
      if (seriesDim) {
        for (const sv of seriesVals) {
          const matchingRows = result.rows.filter(
            (r) => r.keys[xDim] === xVal && r.keys[seriesDim] === sv
          );
          entry[sv] = matchingRows.reduce((sum, r) => sum + (r.measures[measure] || 0), 0);
        }
      } else {
        const matchingRows = result.rows.filter((r) => r.keys[xDim] === xVal);
        entry[measure] = matchingRows.reduce((sum, r) => sum + (r.measures[measure] || 0), 0);
      }
      return entry;
    });

    const colors: Record<string, string> = {};
    seriesVals.forEach((sv, i) => {
      colors[sv] = SERIES_COLORS[i % SERIES_COLORS.length];
    });

    return { chartData: data, seriesKeys: seriesVals, seriesColors: colors };
  }, [config, result]);

  if (chartData.length === 0) {
    return (
      <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
        <p className="text-center text-[var(--muted-foreground)] py-8">{t("reports.pivot.noData")}</p>
      </div>
    );
  }

  const categoryEntries = seriesKeys.map((key, index) => ({
    color: seriesColors[key],
    index,
  }));

  return (
    <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <ChartPatternDefs prefix="pivot-chart" categories={categoryEntries} />
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="name"
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
          {seriesKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="stack"
              fill={getPatternFill("pivot-chart", index, seriesColors[key])}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
