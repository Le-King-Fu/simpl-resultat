import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import type { ImportSummary, ExportMode } from "../../services/dataExportService";

interface ImportConfirmModalProps {
  summary: ImportSummary;
  importType: ExportMode;
  isImporting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ImportConfirmModal({
  summary,
  importType,
  isImporting,
  onConfirm,
  onCancel,
}: ImportConfirmModalProps) {
  const { t } = useTranslation();
  const [confirmText, setConfirmText] = useState("");

  const willDelete: string[] = [];
  const willImport: string[] = [];

  if (importType === "categories_only") {
    willDelete.push(t("settings.dataManagement.import.willDeleteCategories"));
    if (summary.categoriesCount > 0)
      willImport.push(
        t("settings.dataManagement.import.countCategories", {
          count: summary.categoriesCount,
        })
      );
    if (summary.suppliersCount > 0)
      willImport.push(
        t("settings.dataManagement.import.countSuppliers", {
          count: summary.suppliersCount,
        })
      );
    if (summary.keywordsCount > 0)
      willImport.push(
        t("settings.dataManagement.import.countKeywords", {
          count: summary.keywordsCount,
        })
      );
  } else if (importType === "transactions_with_categories") {
    willDelete.push(t("settings.dataManagement.import.willDeleteAll"));
    if (summary.categoriesCount > 0)
      willImport.push(
        t("settings.dataManagement.import.countCategories", {
          count: summary.categoriesCount,
        })
      );
    if (summary.transactionsCount > 0)
      willImport.push(
        t("settings.dataManagement.import.countTransactions", {
          count: summary.transactionsCount,
        })
      );
  } else {
    willDelete.push(t("settings.dataManagement.import.willDeleteTransactions"));
    if (summary.transactionsCount > 0)
      willImport.push(
        t("settings.dataManagement.import.countTransactions", {
          count: summary.transactionsCount,
        })
      );
  }

  const confirmWord = t("settings.dataManagement.import.confirmWord");
  const canConfirm = confirmText === confirmWord && !isImporting;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-md mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 text-[var(--negative)]">
            <AlertTriangle size={20} />
            <h2 className="text-lg font-semibold">
              {t("settings.dataManagement.import.confirmTitle")}
            </h2>
          </div>
          <button
            onClick={onCancel}
            disabled={isImporting}
            className="p-1 rounded hover:bg-[var(--border)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* What will be deleted */}
          <div>
            <p className="text-sm font-medium text-[var(--negative)] mb-1">
              {t("settings.dataManagement.import.willDeleteLabel")}
            </p>
            <ul className="text-sm text-[var(--muted-foreground)] list-disc list-inside">
              {willDelete.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          {/* What will be imported */}
          <div>
            <p className="text-sm font-medium mb-1">
              {t("settings.dataManagement.import.willImportLabel")}
            </p>
            <ul className="text-sm text-[var(--muted-foreground)] list-disc list-inside">
              {willImport.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Warning */}
          <div className="bg-[var(--negative)]/10 border border-[var(--negative)]/30 rounded-lg p-3">
            <p className="text-sm text-[var(--negative)]">
              {t("settings.dataManagement.import.irreversibleWarning")}
            </p>
          </div>

          {/* Confirmation input */}
          <div>
            <label className="text-sm text-[var(--muted-foreground)] block mb-1">
              {t("settings.dataManagement.import.typeToConfirm", {
                word: confirmWord,
              })}
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isImporting}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-[var(--border)]">
          <button
            onClick={onCancel}
            disabled={isImporting}
            className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--border)] transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-[var(--negative)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isImporting && <Loader2 size={14} className="animate-spin" />}
            {t("settings.dataManagement.import.replaceButton")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
