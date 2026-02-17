import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Split } from "lucide-react";
import { PageHelp } from "../components/shared/PageHelp";
import { useAdjustments } from "../hooks/useAdjustments";
import { getEntriesByAdjustmentId } from "../services/adjustmentService";
import type { AdjustmentEntryWithCategory } from "../services/adjustmentService";
import {
  getSplitParentTransactions,
  getSplitChildren,
  saveSplitAdjustment,
  deleteSplitAdjustment,
} from "../services/transactionService";
import type { TransactionRow } from "../shared/types";
import AdjustmentListPanel from "../components/adjustments/AdjustmentListPanel";
import AdjustmentDetailPanel from "../components/adjustments/AdjustmentDetailPanel";
import SplitAdjustmentModal from "../components/transactions/SplitAdjustmentModal";

export default function AdjustmentsPage() {
  const { t } = useTranslation();
  const {
    state,
    selectAdjustment,
    startCreating,
    startEditing,
    cancelEditing,
    saveAdjustment,
    deleteAdjustment,
  } = useAdjustments();

  const [entriesMap, setEntriesMap] = useState<Map<number, AdjustmentEntryWithCategory[]>>(
    new Map()
  );

  const [splitTransactions, setSplitTransactions] = useState<TransactionRow[]>([]);
  const [splitRow, setSplitRow] = useState<TransactionRow | null>(null);

  const loadAllEntries = useCallback(async () => {
    const map = new Map<number, AdjustmentEntryWithCategory[]>();
    for (const adj of state.adjustments) {
      try {
        const entries = await getEntriesByAdjustmentId(adj.id);
        map.set(adj.id, entries);
      } catch {
        // skip on error
      }
    }
    setEntriesMap(map);
  }, [state.adjustments]);

  useEffect(() => {
    if (state.adjustments.length > 0) {
      loadAllEntries();
    }
  }, [state.adjustments, loadAllEntries]);

  const loadSplitTransactions = useCallback(async () => {
    try {
      const rows = await getSplitParentTransactions();
      setSplitTransactions(rows);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadSplitTransactions();
  }, [loadSplitTransactions]);

  const handleSplitSave = async (
    parentId: number,
    entries: Array<{ category_id: number; amount: number; description: string }>
  ) => {
    await saveSplitAdjustment(parentId, entries);
    await loadSplitTransactions();
  };

  const handleSplitDelete = async (parentId: number) => {
    await deleteSplitAdjustment(parentId);
    await loadSplitTransactions();
  };

  const selectedAdjustment =
    state.selectedAdjustmentId !== null
      ? state.adjustments.find((a) => a.id === state.selectedAdjustmentId) ?? null
      : null;

  return (
    <div>
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t("adjustments.title")}</h1>
          <PageHelp helpKey="adjustments" />
        </div>
        <button
          onClick={startCreating}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90"
        >
          <Plus size={16} />
          {t("adjustments.newAdjustment")}
        </button>
      </div>

      {state.error && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--negative)]/10 text-[var(--negative)] text-sm">
          {state.error}
        </div>
      )}

      {state.isLoading ? (
        <p className="text-[var(--muted-foreground)]">{t("common.loading")}</p>
      ) : (
        <div className="flex gap-6" style={{ minHeight: "calc(100vh - 180px)" }}>
          <div className="w-1/3 bg-[var(--card)] rounded-xl border border-[var(--border)] p-3 overflow-y-auto">
            <AdjustmentListPanel
              adjustments={state.adjustments}
              selectedId={state.selectedAdjustmentId}
              onSelect={selectAdjustment}
              entriesByAdjustment={entriesMap}
            />

            {splitTransactions.length > 0 && (
              <>
                <div className="flex items-center gap-2 mt-4 mb-2 px-1">
                  <Split size={14} className="text-[var(--foreground)]" />
                  <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                    {t("adjustments.splitTransactions")}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {splitTransactions.map((tx) => (
                    <button
                      key={tx.id}
                      onClick={() => setSplitRow(tx)}
                      className="w-full flex flex-col gap-1 px-3 py-2.5 text-left rounded-lg transition-colors hover:bg-[var(--muted)]/50"
                    >
                      <span className="font-medium text-sm truncate">{tx.description}</span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-[var(--muted-foreground)]">{tx.date}</span>
                        <span
                          className={`text-xs font-medium ${
                            tx.amount >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
                          }`}
                        >
                          {tx.amount >= 0 ? "+" : ""}
                          {tx.amount.toFixed(2)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <AdjustmentDetailPanel
            selectedAdjustment={selectedAdjustment}
            entries={state.entries}
            categories={state.categories}
            editingAdjustment={state.editingAdjustment}
            editingEntries={state.editingEntries}
            isCreating={state.isCreating}
            isSaving={state.isSaving}
            onStartEditing={startEditing}
            onCancelEditing={cancelEditing}
            onSave={saveAdjustment}
            onDelete={deleteAdjustment}
          />
        </div>
      )}

      {splitRow && (
        <SplitAdjustmentModal
          transaction={splitRow}
          categories={state.categories}
          onLoadChildren={getSplitChildren}
          onSave={handleSplitSave}
          onDelete={handleSplitDelete}
          onClose={() => setSplitRow(null)}
        />
      )}
    </div>
  );
}
