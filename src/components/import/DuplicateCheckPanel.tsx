import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle, FileWarning } from "lucide-react";
import type { DuplicateCheckResult } from "../../shared/types";

interface DuplicateCheckPanelProps {
  result: DuplicateCheckResult;
  onSkipDuplicates: () => void;
  onIncludeAll: () => void;
  skipDuplicates: boolean;
}

export default function DuplicateCheckPanel({
  result,
  onSkipDuplicates,
  onIncludeAll,
  skipDuplicates,
}: DuplicateCheckPanelProps) {
  const { t } = useTranslation();

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

          {/* Duplicate action */}
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="duplicateAction"
                checked={skipDuplicates}
                onChange={onSkipDuplicates}
                className="accent-[var(--primary)]"
              />
              {t("import.duplicates.skip")}
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="duplicateAction"
                checked={!skipDuplicates}
                onChange={onIncludeAll}
                className="accent-[var(--primary)]"
              />
              {t("import.duplicates.includeAll")}
            </label>
          </div>

          {/* Duplicate table */}
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0">
                <tr className="bg-[var(--muted)]">
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
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {result.duplicateRows.map((row) => (
                  <tr
                    key={row.rowIndex}
                    className="bg-[var(--muted)]"
                  >
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
                  </tr>
                ))}
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
        </p>
      </div>
    </div>
  );
}
