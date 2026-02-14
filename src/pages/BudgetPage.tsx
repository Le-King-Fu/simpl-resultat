import { useTranslation } from "react-i18next";
import { PageHelp } from "../components/shared/PageHelp";
import { useBudget } from "../hooks/useBudget";
import YearNavigator from "../components/budget/YearNavigator";
import BudgetTable from "../components/budget/BudgetTable";
import TemplateActions from "../components/budget/TemplateActions";

export default function BudgetPage() {
  const { t } = useTranslation();
  const {
    state,
    navigateYear,
    updatePlanned,
    splitEvenly,
    saveTemplate,
    applyTemplate,
    applyTemplateAllMonths,
    deleteTemplate,
  } = useBudget();

  const { year, rows, templates, isLoading, isSaving, error } = state;

  return (
    <div className={isLoading ? "opacity-50 pointer-events-none" : ""}>
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t("budget.title")}</h1>
          <PageHelp helpKey="budget" />
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <TemplateActions
            templates={templates}
            onApply={applyTemplate}
            onApplyAllMonths={applyTemplateAllMonths}
            onSave={saveTemplate}
            onDelete={deleteTemplate}
            disabled={isSaving}
          />
          <YearNavigator year={year} onNavigate={navigateYear} />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--negative)]/10 text-[var(--negative)] text-sm border border-[var(--negative)]/20">
          {error}
        </div>
      )}

      <BudgetTable
        rows={rows}
        onUpdatePlanned={updatePlanned}
        onSplitEvenly={splitEvenly}
      />
    </div>
  );
}
