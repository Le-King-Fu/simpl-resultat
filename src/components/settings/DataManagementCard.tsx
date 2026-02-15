import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Database,
  Download,
  Upload,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useDataExport } from "../../hooks/useDataExport";
import { useDataImport } from "../../hooks/useDataImport";
import type { ExportMode, ExportFormat } from "../../services/dataExportService";
import ImportConfirmModal from "./ImportConfirmModal";

export default function DataManagementCard() {
  const { t } = useTranslation();
  const exportHook = useDataExport();
  const importHook = useDataImport();

  // Export form state
  const [exportMode, setExportMode] = useState<ExportMode>(
    "transactions_with_categories"
  );
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
  const [encryptExport, setEncryptExport] = useState(false);
  const [exportPassword, setExportPassword] = useState("");
  const [exportPasswordConfirm, setExportPasswordConfirm] = useState("");

  // Import password state
  const [importPassword, setImportPassword] = useState("");

  // CSV is only valid for transaction modes
  const csvDisabled = exportMode === "categories_only";
  if (csvDisabled && exportFormat === "csv") {
    setExportFormat("json");
  }

  const passwordsMatch = exportPassword === exportPasswordConfirm;
  const passwordValid = !encryptExport || (exportPassword.length >= 8 && passwordsMatch);

  const handleExport = () => {
    exportHook.performExport(
      exportMode,
      exportFormat,
      encryptExport ? exportPassword : undefined
    );
  };

  const handleImportPasswordSubmit = () => {
    importHook.readWithPassword(importPassword);
    setImportPassword("");
  };

  return (
    <>
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Database size={18} />
          {t("settings.dataManagement.title")}
        </h2>

        {/* === EXPORT SECTION === */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
            {t("settings.dataManagement.export.title")}
          </h3>

          {/* Export mode */}
          <div>
            <label className="text-sm block mb-1">
              {t("settings.dataManagement.export.modeLabel")}
            </label>
            <select
              value={exportMode}
              onChange={(e) => setExportMode(e.target.value as ExportMode)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
            >
              <option value="transactions_with_categories">
                {t("settings.dataManagement.export.modeTransactionsWithCategories")}
              </option>
              <option value="transactions_only">
                {t("settings.dataManagement.export.modeTransactionsOnly")}
              </option>
              <option value="categories_only">
                {t("settings.dataManagement.export.modeCategoriesOnly")}
              </option>
            </select>
          </div>

          {/* Export format */}
          <div>
            <label className="text-sm block mb-1">
              {t("settings.dataManagement.export.formatLabel")}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="exportFormat"
                  value="json"
                  checked={exportFormat === "json"}
                  onChange={() => setExportFormat("json")}
                  className="accent-[var(--primary)]"
                />
                JSON
              </label>
              <label
                className={`flex items-center gap-2 text-sm ${
                  csvDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <input
                  type="radio"
                  name="exportFormat"
                  value="csv"
                  checked={exportFormat === "csv"}
                  onChange={() => setExportFormat("csv")}
                  disabled={csvDisabled}
                  className="accent-[var(--primary)]"
                />
                CSV
                {csvDisabled && (
                  <span className="text-xs text-[var(--muted-foreground)]">
                    ({t("settings.dataManagement.export.csvDisabledNote")})
                  </span>
                )}
              </label>
            </div>
          </div>

          {/* Encryption */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={encryptExport}
                onChange={(e) => {
                  setEncryptExport(e.target.checked);
                  if (!e.target.checked) {
                    setExportPassword("");
                    setExportPasswordConfirm("");
                  }
                }}
                className="accent-[var(--primary)]"
              />
              <Lock size={14} />
              {t("settings.dataManagement.export.encryptLabel")}
            </label>

            {encryptExport && (
              <div className="space-y-2 ml-6">
                <input
                  type="password"
                  placeholder={t("settings.dataManagement.export.passwordPlaceholder")}
                  value={exportPassword}
                  onChange={(e) => setExportPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
                />
                <input
                  type="password"
                  placeholder={t("settings.dataManagement.export.passwordConfirmPlaceholder")}
                  value={exportPasswordConfirm}
                  onChange={(e) => setExportPasswordConfirm(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
                />
                {exportPassword.length > 0 && exportPassword.length < 8 && (
                  <p className="text-xs text-[var(--negative)]">
                    {t("settings.dataManagement.export.passwordTooShort")}
                  </p>
                )}
                {exportPassword.length >= 8 &&
                  exportPasswordConfirm.length > 0 &&
                  !passwordsMatch && (
                    <p className="text-xs text-[var(--negative)]">
                      {t("settings.dataManagement.export.passwordMismatch")}
                    </p>
                  )}
              </div>
            )}
          </div>

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={
              exportHook.state.status === "exporting" || !passwordValid
            }
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {exportHook.state.status === "exporting" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {t("settings.dataManagement.export.button")}
          </button>

          {/* Export feedback */}
          {exportHook.state.status === "success" && (
            <div className="flex items-center gap-2 text-[var(--positive)] text-sm">
              <CheckCircle size={14} />
              {t("settings.dataManagement.export.success")}
            </div>
          )}
          {exportHook.state.status === "error" && (
            <div className="flex items-center gap-2 text-[var(--negative)] text-sm">
              <AlertCircle size={14} />
              {exportHook.state.error}
            </div>
          )}
        </div>

        {/* Divider */}
        <hr className="border-[var(--border)]" />

        {/* === IMPORT SECTION === */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
            {t("settings.dataManagement.import.title")}
          </h3>

          <p className="text-sm text-[var(--muted-foreground)]">
            {t("settings.dataManagement.import.description")}
          </p>

          {/* Import button */}
          <button
            onClick={importHook.pickAndRead}
            disabled={
              importHook.state.status === "reading" ||
              importHook.state.status === "importing"
            }
            className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--border)] transition-colors disabled:opacity-50"
          >
            {importHook.state.status === "reading" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {t("settings.dataManagement.import.button")}
          </button>

          {/* Password prompt for encrypted files */}
          {importHook.state.status === "needsPassword" && (
            <div className="space-y-2 p-3 border border-[var(--border)] rounded-lg">
              <p className="text-sm">
                <Lock size={14} className="inline mr-1" />
                {t("settings.dataManagement.import.passwordRequired")}
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder={t("settings.dataManagement.import.passwordPlaceholder")}
                  value={importPassword}
                  onChange={(e) => setImportPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && importPassword) handleImportPasswordSubmit();
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
                  autoFocus
                />
                <button
                  onClick={handleImportPasswordSubmit}
                  disabled={!importPassword}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
                >
                  {t("settings.dataManagement.import.decrypt")}
                </button>
                <button
                  onClick={importHook.reset}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--border)] transition-colors text-sm"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          )}

          {/* Import feedback */}
          {importHook.state.status === "success" && (
            <div className="flex items-center gap-2 text-[var(--positive)] text-sm">
              <CheckCircle size={14} />
              {t("settings.dataManagement.import.success")}
            </div>
          )}
          {importHook.state.status === "error" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[var(--negative)] text-sm">
                <AlertCircle size={14} />
                {importHook.state.error}
              </div>
              <button
                onClick={importHook.reset}
                className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                {t("settings.dataManagement.import.tryAgain")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Import confirmation modal */}
      {importHook.state.status === "confirming" &&
        importHook.state.summary &&
        importHook.state.importType && (
          <ImportConfirmModal
            summary={importHook.state.summary}
            importType={importHook.state.importType}
            isImporting={false}
            onConfirm={importHook.executeImport}
            onCancel={importHook.reset}
          />
        )}
      {importHook.state.status === "importing" && importHook.state.summary && importHook.state.importType && (
        <ImportConfirmModal
          summary={importHook.state.summary}
          importType={importHook.state.importType}
          isImporting={true}
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      )}
    </>
  );
}
