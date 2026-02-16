import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Wand2 } from "lucide-react";
import { PageHelp } from "../components/shared/PageHelp";
import { useTransactions } from "../hooks/useTransactions";
import TransactionFilterBar from "../components/transactions/TransactionFilterBar";
import TransactionSummaryBar from "../components/transactions/TransactionSummaryBar";
import TransactionTable from "../components/transactions/TransactionTable";
import TransactionPagination from "../components/transactions/TransactionPagination";

export default function TransactionsPage() {
  const { t } = useTranslation();
  const { state, setFilter, setSort, setPage, updateCategory, saveNotes, autoCategorize, addKeywordToCategory, loadSplitChildren, saveSplit, deleteSplit } =
    useTransactions();
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const handleAutoCategorize = async () => {
    setResultMessage(null);
    const count = await autoCategorize();
    if (count > 0) {
      setResultMessage(t("transactions.autoCategorizeResult", { count }));
    } else {
      setResultMessage(t("transactions.autoCategorizeNone"));
    }
    setTimeout(() => setResultMessage(null), 4000);
  };

  return (
    <div>
      <div className="relative flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">{t("transactions.title")}</h1>
        <PageHelp helpKey="transactions" />
        <button
          onClick={handleAutoCategorize}
          disabled={state.isAutoCategorizing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Wand2 size={16} />
          {state.isAutoCategorizing
            ? t("common.loading")
            : t("transactions.autoCategorize")}
        </button>
        {resultMessage && (
          <span className="text-sm text-[var(--muted-foreground)]">
            {resultMessage}
          </span>
        )}
      </div>

      <TransactionFilterBar
        filters={state.filters}
        categories={state.categories}
        sources={state.sources}
        onFilterChange={setFilter}
      />

      <TransactionSummaryBar
        totalCount={state.totalCount}
        totalAmount={state.totalAmount}
        incomeTotal={state.incomeTotal}
        expenseTotal={state.expenseTotal}
      />

      {state.error && (
        <div className="mb-4 p-3 rounded-lg bg-[color-mix(in_srgb,var(--negative)_10%,var(--card))] border border-[var(--negative)] text-[var(--negative)] text-sm">
          {state.error}
        </div>
      )}

      {state.isLoading ? (
        <div className="text-center py-8 text-[var(--muted-foreground)]">
          {t("common.loading")}
        </div>
      ) : (
        <>
          <TransactionTable
            rows={state.rows}
            sort={state.sort}
            categories={state.categories}
            onSort={setSort}
            onCategoryChange={updateCategory}
            onNotesChange={saveNotes}
            onAddKeyword={addKeywordToCategory}
            onLoadSplitChildren={loadSplitChildren}
            onSaveSplit={saveSplit}
            onDeleteSplit={deleteSplit}
          />

          <TransactionPagination
            page={state.page}
            pageSize={state.pageSize}
            totalCount={state.totalCount}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
