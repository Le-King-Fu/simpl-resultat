import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle, FileWarning } from "lucide-react";
import type { DuplicateCheckResult } from "../../shared/types";

interface DuplicateCheckPanelProps {
  result: DuplicateCheckResult;
  excludedIndices: Set<number>;
  onToggleRow: (index: number) => void;
  onSkipAll: () => void;
  onIncludeAll: () => void;
}

export default function DuplicateCheckPanel({
  result,
  excludedIndices,
  onToggleRow,
  onSkipAll,
  onIncludeAll,
}: DuplicateCheckPanelProps) {
  const { t } = useTranslation();

  const allExcluded = result.duplicateRows.length > 0 &&
    result.duplicateRows.every((d) => excludedIndices.has(d.rowIndex));
  const noneExcluded = result.duplicateRows.every((d) => !excludedIndices.has(d.rowIndex));

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">
        {t("import.duplicates.title")}
      </h2>

      {/* File-level duplicate */}
      {result.fileAlreadyImported && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--card)] border-2 border-[var(--accent)]">
          <FileWarning size={20} className="text-[var(--accent)] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              {t("import.duplicates.fileAlreadyImported")}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              {t("import.duplicates.fileAlreadyImportedDesc")}
            </p>
          </div>
        </div>
      )}

      {/* Row-level duplicates */}
      {result.duplicateRows.length > 0 ? (
        <div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--card)] border-2 border-[var(--accent)] mb-4">
            <AlertTriangle
              size={20}
              className="text-[var(--accent)] shrink-0 mt-0.5"
            />
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                {t("import.duplicates.rowsFound", {
                  count: result.duplicateRows.length,
                })}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                {t("import.duplicates.rowsFoundDesc")}
              </p>
            </div>
          </div>

          {/* Bulk actions */}
          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={onSkipAll}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                allExcluded
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-[var(--card)] border-[var(--border)] hover:bg-[var(--muted)]"
              }`}
            >
              {t("import.duplicates.skip")}
            </button>
            <button
              type="button"
              onClick={onIncludeAll}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                noneExcluded
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-[var(--card)] border-[var(--border)] hover:bg-[var(--muted)]"
              }`}
            >
              {t("import.duplicates.includeAll")}
            </button>
          </div>

          {/* Duplicate table */}
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0">
                <tr className="bg-[var(--muted)]">
                  <th className="px-3 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] w-10">
                    <input
                      type="checkbox"
                      checked={noneExcluded}
                      onChange={() => noneExcluded ? onSkipAll() : onIncludeAll()}
                      className="accent-[var(--primary)]"
                    />
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-[var(--muted-foreground)]">
                    #
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-[var(--muted-foreground)]">
                    {t("import.preview.date")}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-[var(--muted-foreground)]">
                    {t("import.preview.description")}
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-[var(--muted-foreground)]">
                    {t("import.preview.amount")}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-[var(--muted-foreground)]">
                    {t("import.source")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {result.duplicateRows.map((row) => {
                  const included = !excludedIndices.has(row.rowIndex);
                  const isBatch = row.existingTransactionId === -1;
                  return (
                    <tr
                      key={row.rowIndex}
                      className={included ? "bg-[var(--card)]" : "bg-[var(--muted)] opacity-60"}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={included}
                          onChange={() => onToggleRow(row.rowIndex)}
                          className="accent-[var(--primary)]"
                        />
                      </td>
                      <td className="px-3 py-2 text-[var(--muted-foreground)]">
                        {row.rowIndex + 1}
                      </td>
                      <td className="px-3 py-2">{row.date}</td>
                      <td className="px-3 py-2 max-w-xs truncate">
                        {row.description}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {row.amount.toFixed(2)}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                            isBatch
                              ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                              : "bg-[var(--primary)]/15 text-[var(--primary)]"
                          }`}
                        >
                          {isBatch
                            ? t("import.duplicates.sourceBatch")
                            : t("import.duplicates.sourceDb")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        !result.fileAlreadyImported && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--card)] border-2 border-[var(--positive)]">
            <CheckCircle size={20} className="text-[var(--positive)]" />
            <p className="text-sm font-medium text-[var(--foreground)]">
              {t("import.duplicates.noneFound")}
            </p>
          </div>
        )
      )}

      {/* Summary */}
      <div className="p-4 rounded-xl bg-[var(--muted)]">
        <p className="text-sm text-[var(--foreground)]">
          {t("import.duplicates.summary", {
            total: result.newRows.length + result.duplicateRows.length,
            new: result.newRows.length,
            duplicates: result.duplicateRows.length,
          })}
          {excludedIndices.size > 0 && (
            <span className="text-[var(--muted-foreground)]">
              {" "}— {excludedIndices.size} {t("import.duplicates.skip").toLowerCase()}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
