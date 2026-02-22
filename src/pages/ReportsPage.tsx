import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useReports } from "../hooks/useReports";
import { PageHelp } from "../components/shared/PageHelp";
import type { ReportTab, CategoryBreakdownItem, DashboardPeriod } from "../shared/types";
import PeriodSelector from "../components/dashboard/PeriodSelector";
import MonthNavigator from "../components/budget/MonthNavigator";
import MonthlyTrendsChart from "../components/reports/MonthlyTrendsChart";
import CategoryBarChart from "../components/reports/CategoryBarChart";
import CategoryOverTimeChart from "../components/reports/CategoryOverTimeChart";
import BudgetVsActualTable from "../components/reports/BudgetVsActualTable";
import DynamicReport from "../components/reports/DynamicReport";
import TransactionDetailModal from "../components/shared/TransactionDetailModal";

const TABS: ReportTab[] = ["trends", "byCategory", "overTime", "budgetVsActual", "dynamic"];

function computeDateRange(
  period: DashboardPeriod,
  customDateFrom?: string,
  customDateTo?: string,
): { dateFrom?: string; dateTo?: string } {
  if (period === "all") return {};
  if (period === "custom" && customDateFrom && customDateTo) {
    return { dateFrom: customDateFrom, dateTo: customDateTo };
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const dateTo = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  let from: Date;
  switch (period) {
    case "month": from = new Date(year, month, 1); break;
    case "3months": from = new Date(year, month - 2, 1); break;
    case "6months": from = new Date(year, month - 5, 1); break;
    case "12months": from = new Date(year, month - 11, 1); break;
    default: from = new Date(year, month, 1); break;
  }
  const dateFrom = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(from.getDate()).padStart(2, "0")}`;
  return { dateFrom, dateTo };
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const { state, setTab, setPeriod, setCustomDates, navigateBudgetMonth, setPivotConfig } = useReports();

  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());
  const [detailModal, setDetailModal] = useState<CategoryBreakdownItem | null>(null);

  const toggleHidden = useCallback((name: string) => {
    setHiddenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const showAll = useCallback(() => setHiddenCategories(new Set()), []);

  const viewDetails = useCallback((item: CategoryBreakdownItem) => {
    setDetailModal(item);
  }, []);

  const { dateFrom, dateTo } = computeDateRange(state.period, state.customDateFrom, state.customDateTo);

  return (
    <div className={state.isLoading ? "opacity-50 pointer-events-none" : ""}>
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t("reports.title")}</h1>
          <PageHelp helpKey="reports" />
        </div>
        {state.tab === "budgetVsActual" ? (
          <MonthNavigator
            year={state.budgetYear}
            month={state.budgetMonth}
            onNavigate={navigateBudgetMonth}
          />
        ) : (
          <PeriodSelector
            value={state.period}
            onChange={setPeriod}
            customDateFrom={state.customDateFrom}
            customDateTo={state.customDateTo}
            onCustomDateChange={setCustomDates}
          />
        )}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === state.tab
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
            }`}
          >
            {t(`reports.${tab}`)}
          </button>
        ))}
      </div>

      {state.error && (
        <div className="bg-[var(--negative)]/10 text-[var(--negative)] rounded-xl p-4 mb-6">
          {state.error}
        </div>
      )}

      {state.tab === "trends" && <MonthlyTrendsChart data={state.monthlyTrends} />}
      {state.tab === "byCategory" && (
        <CategoryBarChart
          data={state.categorySpending}
          hiddenCategories={hiddenCategories}
          onToggleHidden={toggleHidden}
          onShowAll={showAll}
          onViewDetails={viewDetails}
        />
      )}
      {state.tab === "overTime" && (
        <CategoryOverTimeChart
          data={state.categoryOverTime}
          hiddenCategories={hiddenCategories}
          onToggleHidden={toggleHidden}
          onShowAll={showAll}
          onViewDetails={viewDetails}
        />
      )}
      {state.tab === "budgetVsActual" && (
        <BudgetVsActualTable data={state.budgetVsActual} />
      )}
      {state.tab === "dynamic" && (
        <DynamicReport
          config={state.pivotConfig}
          result={state.pivotResult}
          onConfigChange={setPivotConfig}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      )}

      {detailModal && (
        <TransactionDetailModal
          categoryId={detailModal.category_id}
          categoryName={detailModal.category_name}
          categoryColor={detailModal.category_color}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onClose={() => setDetailModal(null)}
        />
      )}
    </div>
  );
}
