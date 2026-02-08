import { useTranslation } from "react-i18next";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Tag,
  FileText,
} from "lucide-react";
import type { ImportReport } from "../../shared/types";

interface ImportReportPanelProps {
  report: ImportReport;
  onDone: () => void;
}

export default function ImportReportPanel({
  report,
  onDone,
}: ImportReportPanelProps) {
  const { t } = useTranslation();

  const stats = [
    {
      icon: FileText,
      label: t("import.report.totalRows"),
      value: report.totalRows,
      color: "text-[var(--foreground)]",
    },
    {
      icon: CheckCircle,
      label: t("import.report.imported"),
      value: report.importedCount,
      color: "text-[var(--positive)]",
    },
    {
      icon: AlertTriangle,
      label: t("import.report.skippedDuplicates"),
      value: report.skippedDuplicates,
      color: "text-[var(--accent)]",
    },
    {
      icon: XCircle,
      label: t("import.report.errors"),
      value: report.errorCount,
      color: "text-[var(--negative)]",
    },
    {
      icon: Tag,
      label: t("import.report.categorized"),
      value: report.categorizedCount,
      color: "text-[var(--primary)]",
    },
    {
      icon: Tag,
      label: t("import.report.uncategorized"),
      value: report.uncategorizedCount,
      color: "text-[var(--muted-foreground)]",
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">
        {t("import.report.title")}
      </h2>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)]"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={16} className={stat.color} />
              <span className="text-xs text-[var(--muted-foreground)]">
                {stat.label}
              </span>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Errors list */}
      {report.errors.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 text-[var(--negative)]">
            {t("import.report.errorDetails")}
          </h3>
          <div className="max-h-48 overflow-y-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--muted)]">
                  <th className="px-3 py-2 text-left text-xs font-medium text-[var(--muted-foreground)]">
                    {t("import.report.row")}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-[var(--muted-foreground)]">
                    {t("import.report.errorMessage")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {report.errors.map((err, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">{err.rowIndex + 1}</td>
                    <td className="px-3 py-2 text-[var(--negative)]">{err.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Done button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onDone}
          className="px-6 py-2 text-sm rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-opacity"
        >
          {t("import.report.done")}
        </button>
      </div>
    </div>
  );
}
