import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { PageHelp } from "../components/shared/PageHelp";
import { useAdjustments } from "../hooks/useAdjustments";
import { getEntriesByAdjustmentId } from "../services/adjustmentService";
import type { AdjustmentEntryWithCategory } from "../services/adjustmentService";
import AdjustmentListPanel from "../components/adjustments/AdjustmentListPanel";
import AdjustmentDetailPanel from "../components/adjustments/AdjustmentDetailPanel";

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
    </div>
  );
}
