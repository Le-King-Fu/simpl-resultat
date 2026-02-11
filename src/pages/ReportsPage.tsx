import { useTranslation } from "react-i18next";
import { useReports } from "../hooks/useReports";
import { PageHelp } from "../components/shared/PageHelp";
import type { ReportTab } from "../shared/types";
import PeriodSelector from "../components/dashboard/PeriodSelector";
import MonthlyTrendsChart from "../components/reports/MonthlyTrendsChart";
import CategoryBarChart from "../components/reports/CategoryBarChart";
import CategoryOverTimeChart from "../components/reports/CategoryOverTimeChart";

const TABS: ReportTab[] = ["trends", "byCategory", "overTime"];

export default function ReportsPage() {
  const { t } = useTranslation();
  const { state, setTab, setPeriod } = useReports();

  return (
    <div className={state.isLoading ? "opacity-50 pointer-events-none" : ""}>
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t("reports.title")}</h1>
          <PageHelp helpKey="reports" />
        </div>
        <PeriodSelector value={state.period} onChange={setPeriod} />
      </div>

      <div className="flex gap-2 mb-6">
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
        <div className="bg-red-100 text-red-700 rounded-xl p-4 mb-6">
          {state.error}
        </div>
      )}

      {state.tab === "trends" && <MonthlyTrendsChart data={state.monthlyTrends} />}
      {state.tab === "byCategory" && <CategoryBarChart data={state.categorySpending} />}
      {state.tab === "overTime" && <CategoryOverTimeChart data={state.categoryOverTime} />}
    </div>
  );
}
