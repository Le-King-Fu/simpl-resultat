import { useTranslation } from "react-i18next";
import { useTransactions } from "../hooks/useTransactions";
import TransactionFilterBar from "../components/transactions/TransactionFilterBar";
import TransactionSummaryBar from "../components/transactions/TransactionSummaryBar";
import TransactionTable from "../components/transactions/TransactionTable";
import TransactionPagination from "../components/transactions/TransactionPagination";

export default function TransactionsPage() {
  const { t } = useTranslation();
  const { state, setFilter, setSort, setPage, updateCategory, saveNotes } =
    useTransactions();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("transactions.title")}</h1>

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
