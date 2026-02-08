import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";
import type { ParsedRow } from "../../shared/types";

interface FilePreviewTableProps {
  rows: ParsedRow[];
}

export default function FilePreviewTable({
  rows,
}: FilePreviewTableProps) {
  const { t } = useTranslation();

  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--muted-foreground)]">
        {t("import.preview.noData")}
      </div>
    );
  }

  const errorCount = rows.filter((r) => r.error).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {t("import.preview.title")}
        </h2>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-[var(--muted-foreground)]">
            {t("import.preview.rowCount", { count: rows.length })}
          </span>
          {errorCount > 0 && (
            <span className="flex items-center gap-1 text-red-500">
              <AlertCircle size={14} />
              {t("import.preview.errorCount", { count: errorCount })}
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
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
              <th className="px-3 py-2 text-left text-xs font-medium text-[var(--muted-foreground)]">
                {t("import.preview.raw")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {rows.map((row) => (
              <tr
                key={row.rowIndex}
                className={
                  row.error
                    ? "bg-red-50 dark:bg-red-950/20"
                    : "hover:bg-[var(--muted)]"
                }
              >
                <td className="px-3 py-2 text-[var(--muted-foreground)]">
                  {row.rowIndex + 1}
                </td>
                <td className="px-3 py-2">
                  {row.parsed?.date || (
                    <span className="text-red-500 text-xs">
                      {row.error || "—"}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 max-w-xs truncate">
                  {row.parsed?.description || "—"}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {row.parsed?.amount != null
                    ? row.parsed.amount.toFixed(2)
                    : "—"}
                </td>
                <td className="px-3 py-2 text-xs text-[var(--muted-foreground)] max-w-xs truncate">
                  <span className="inline-flex gap-0">
                    {row.raw.map((cell, i) => (
                      <span key={i}>
                        {i > 0 && <span className="text-[var(--border)] mx-0.5">{'·'}</span>}
                        {cell}
                      </span>
                    ))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
