import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Table, BarChart3, Columns, Maximize2, Minimize2 } from "lucide-react";
import type { PivotConfig, PivotResult } from "../../shared/types";
import DynamicReportPanel from "./DynamicReportPanel";
import DynamicReportTable from "./DynamicReportTable";
import DynamicReportChart from "./DynamicReportChart";

type ViewMode = "table" | "chart" | "both";

interface DynamicReportProps {
  config: PivotConfig;
  result: PivotResult;
  onConfigChange: (config: PivotConfig) => void;
  dateFrom?: string;
  dateTo?: string;
}

export default function DynamicReport({ config, result, onConfigChange, dateFrom, dateTo }: DynamicReportProps) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [fullscreen, setFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => setFullscreen((prev) => !prev), []);

  // Escape key exits fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [fullscreen]);

  const hasConfig = (config.rows.length > 0 || config.columns.length > 0) && config.values.length > 0;

  const viewButtons: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: "table", icon: <Table size={14} />, label: t("reports.pivot.viewTable") },
    { mode: "chart", icon: <BarChart3 size={14} />, label: t("reports.pivot.viewChart") },
    { mode: "both", icon: <Columns size={14} />, label: t("reports.pivot.viewBoth") },
  ];

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-50 bg-[var(--background)] overflow-auto p-6"
          : ""
      }
    >
      <div className="flex gap-4 items-start">
        {/* Content area */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-1">
            {hasConfig && viewButtons.map(({ mode, icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  mode === viewMode
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
            <div className="flex-1" />
            <button
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              title={fullscreen ? t("reports.pivot.exitFullscreen") : t("reports.pivot.fullscreen")}
            >
              {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {fullscreen ? t("reports.pivot.exitFullscreen") : t("reports.pivot.fullscreen")}
            </button>
          </div>

          {/* Empty state */}
          {!hasConfig && (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center text-[var(--muted-foreground)]">
              {t("reports.pivot.noConfig")}
            </div>
          )}

          {/* Table */}
          {hasConfig && (viewMode === "table" || viewMode === "both") && (
            <DynamicReportTable config={config} result={result} />
          )}

          {/* Chart */}
          {hasConfig && (viewMode === "chart" || viewMode === "both") && (
            <DynamicReportChart config={config} result={result} />
          )}
        </div>

        {/* Side panel */}
        <DynamicReportPanel
          config={config}
          onChange={onConfigChange}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      </div>
    </div>
  );
}
