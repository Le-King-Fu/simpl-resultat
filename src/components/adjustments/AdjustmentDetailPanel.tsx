import { useTranslation } from "react-i18next";
import { Pencil, RefreshCw } from "lucide-react";
import type { Adjustment, Category } from "../../shared/types";
import type { AdjustmentEntryWithCategory } from "../../services/adjustmentService";
import type { AdjustmentFormData, EntryFormData } from "../../hooks/useAdjustments";
import AdjustmentForm from "./AdjustmentForm";

interface Props {
  selectedAdjustment: Adjustment | null;
  entries: AdjustmentEntryWithCategory[];
  categories: Category[];
  editingAdjustment: AdjustmentFormData | null;
  editingEntries: EntryFormData[];
  isCreating: boolean;
  isSaving: boolean;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSave: (data: AdjustmentFormData, entries: EntryFormData[]) => void;
  onDelete: (id: number) => void;
}

export default function AdjustmentDetailPanel({
  selectedAdjustment,
  entries,
  categories,
  editingAdjustment,
  editingEntries,
  isCreating,
  isSaving,
  onStartEditing,
  onCancelEditing,
  onSave,
  onDelete,
}: Props) {
  const { t } = useTranslation();

  const handleDelete = () => {
    if (!selectedAdjustment) return;
    if (!confirm(t("adjustments.deleteConfirm"))) return;
    onDelete(selectedAdjustment.id);
  };

  // No selection and not creating
  if (!selectedAdjustment && !isCreating) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--card)] rounded-xl border border-[var(--border)] p-8">
        <p className="text-[var(--muted-foreground)]">{t("adjustments.selectAdjustment")}</p>
      </div>
    );
  }

  // Creating new
  if (isCreating && editingAdjustment) {
    return (
      <div className="flex-1 bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">{t("adjustments.newAdjustment")}</h2>
        <AdjustmentForm
          initialData={editingAdjustment}
          initialEntries={editingEntries}
          categories={categories}
          isCreating
          isSaving={isSaving}
          onSave={onSave}
          onCancel={onCancelEditing}
        />
      </div>
    );
  }

  if (!selectedAdjustment) return null;

  // Editing existing
  if (editingAdjustment) {
    return (
      <div className="flex-1 bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">{t("adjustments.editAdjustment")}</h2>
        <AdjustmentForm
          initialData={editingAdjustment}
          initialEntries={editingEntries}
          categories={categories}
          isCreating={false}
          isSaving={isSaving}
          onSave={onSave}
          onCancel={onCancelEditing}
          onDelete={handleDelete}
        />
      </div>
    );
  }

  // Read-only view
  const total = entries.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="flex-1 bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{selectedAdjustment.name}</h2>
          {selectedAdjustment.is_recurring && (
            <RefreshCw size={14} className="text-[var(--primary)]" />
          )}
        </div>
        <button
          onClick={onStartEditing}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)]"
        >
          <Pencil size={14} />
          {t("common.edit")}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <span className="text-[var(--muted-foreground)]">{t("adjustments.date")}</span>
          <p className="font-medium">{selectedAdjustment.date}</p>
        </div>
        <div>
          <span className="text-[var(--muted-foreground)]">{t("adjustments.recurring")}</span>
          <p className="font-medium">{selectedAdjustment.is_recurring ? "Yes" : "No"}</p>
        </div>
        {selectedAdjustment.description && (
          <div className="col-span-2">
            <span className="text-[var(--muted-foreground)]">{t("adjustments.description")}</span>
            <p className="font-medium">{selectedAdjustment.description}</p>
          </div>
        )}
      </div>

      {/* Entries table */}
      <div className="border-t border-[var(--border)] pt-4">
        <h3 className="text-sm font-semibold mb-3">{t("adjustments.entries")}</h3>
        {entries.length === 0 ? (
          <p className="text-xs text-[var(--muted-foreground)]">{t("adjustments.noEntries")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted-foreground)] text-xs">
                <th className="pb-2 font-medium">{t("adjustments.category")}</th>
                <th className="pb-2 font-medium">{t("adjustments.description")}</th>
                <th className="pb-2 font-medium text-right">{t("adjustments.amount")}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-[var(--border)]/50">
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entry.category_color }}
                      />
                      {entry.category_name}
                    </div>
                  </td>
                  <td className="py-2 text-[var(--muted-foreground)]">
                    {entry.description || "—"}
                  </td>
                  <td
                    className={`py-2 text-right font-medium ${
                      entry.amount >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
                    }`}
                  >
                    {entry.amount >= 0 ? "+" : ""}
                    {entry.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-[var(--border)]">
                <td className="py-2 font-semibold" colSpan={2}>
                  {t("adjustments.total")}
                </td>
                <td
                  className={`py-2 text-right font-semibold ${
                    total >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
                  }`}
                >
                  {total >= 0 ? "+" : ""}
                  {total.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
