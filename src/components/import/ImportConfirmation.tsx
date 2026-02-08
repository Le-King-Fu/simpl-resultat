import { useTranslation } from "react-i18next";
import { FileText, Settings, CheckCircle } from "lucide-react";
import type { SourceConfig, ScannedFile, DuplicateCheckResult } from "../../shared/types";

interface ImportConfirmationProps {
  sourceName: string;
  config: SourceConfig;
  selectedFiles: ScannedFile[];
  duplicateResult: DuplicateCheckResult;
  skipDuplicates: boolean;
}

export default function ImportConfirmation({
  sourceName,
  config,
  selectedFiles,
  duplicateResult,
  skipDuplicates,
}: ImportConfirmationProps) {
  const { t } = useTranslation();

  const rowsToImport = skipDuplicates
    ? duplicateResult.newRows.length
    : duplicateResult.newRows.length + duplicateResult.duplicateRows.length;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">
        {t("import.confirm.title")}
      </h2>

      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
        {/* Source */}
        <div className="p-4 flex items-center gap-3">
          <Settings size={18} className="text-[var(--primary)]" />
          <div>
            <p className="text-sm font-medium">{t("import.confirm.source")}</p>
            <p className="text-sm text-[var(--muted-foreground)]">
              {sourceName}
            </p>
          </div>
        </div>

        {/* Files */}
        <div className="p-4 flex items-center gap-3">
          <FileText size={18} className="text-[var(--primary)]" />
          <div>
            <p className="text-sm font-medium">{t("import.confirm.files")}</p>
            <p className="text-sm text-[var(--muted-foreground)]">
              {selectedFiles.map((f) => f.filename).join(", ")}
            </p>
          </div>
        </div>

        {/* Config summary */}
        <div className="p-4">
          <p className="text-sm font-medium mb-2">
            {t("import.confirm.settings")}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-[var(--muted-foreground)]">
            <div>
              <span className="font-medium">{t("import.config.delimiter")}:</span>{" "}
              {config.delimiter === ";" ? ";" : config.delimiter === "," ? "," : config.delimiter}
            </div>
            <div>
              <span className="font-medium">{t("import.config.encoding")}:</span>{" "}
              {config.encoding}
            </div>
            <div>
              <span className="font-medium">{t("import.config.dateFormat")}:</span>{" "}
              {config.dateFormat}
            </div>
            <div>
              <span className="font-medium">{t("import.config.skipLines")}:</span>{" "}
              {config.skipLines}
            </div>
          </div>
        </div>

        {/* Rows to import */}
        <div className="p-4 flex items-center gap-3">
          <CheckCircle size={18} className="text-emerald-500" />
          <div>
            <p className="text-sm font-medium">
              {t("import.confirm.rowsToImport")}
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">
              {t("import.confirm.rowsSummary", {
                count: rowsToImport,
                skipped: skipDuplicates ? duplicateResult.duplicateRows.length : 0,
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
