import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Wand2, Check, Save, X } from "lucide-react";
import type {
  ScannedSource,
  ScannedFile,
  SourceConfig,
  AmountMode,
  ColumnMapping,
  ImportConfigTemplate,
} from "../../shared/types";
import ColumnMappingEditor from "./ColumnMappingEditor";

interface SourceConfigPanelProps {
  source: ScannedSource;
  config: SourceConfig;
  selectedFiles: ScannedFile[];
  importedFileNames?: Set<string>;
  headers: string[];
  configTemplates: ImportConfigTemplate[];
  onConfigChange: (config: SourceConfig) => void;
  onFileToggle: (file: ScannedFile) => void;
  onSelectAllFiles: () => void;
  onAutoDetect: () => void;
  onSaveAsTemplate: (name: string) => void;
  onApplyTemplate: (id: number) => void;
  onDeleteTemplate: (id: number) => void;
  isLoading?: boolean;
}

export default function SourceConfigPanel({
  source,
  config,
  selectedFiles,
  importedFileNames,
  headers,
  configTemplates,
  onConfigChange,
  onFileToggle,
  onSelectAllFiles,
  onAutoDetect,
  onSaveAsTemplate,
  onApplyTemplate,
  onDeleteTemplate,
  isLoading,
}: SourceConfigPanelProps) {
  const { t } = useTranslation();
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const selectClass =
    "w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]";
  const inputClass = selectClass;

  const updateConfig = (partial: Partial<SourceConfig>) => {
    onConfigChange({ ...config, ...partial });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {t("import.config.title")} — {source.folder_name}
        </h2>
        <button
          onClick={onAutoDetect}
          disabled={isLoading || selectedFiles.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Wand2 size={16} />
          {t("import.config.autoDetect")}
        </button>
      </div>

      {/* Template row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <label className="text-sm text-[var(--muted-foreground)] whitespace-nowrap">
            {t("import.config.loadTemplate")}
          </label>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) onApplyTemplate(Number(e.target.value));
            }}
            className={selectClass + " flex-1"}
          >
            <option value="">
              {configTemplates.length === 0
                ? t("import.config.noTemplates")
                : `— ${t("import.config.loadTemplate")} —`}
            </option>
            {configTemplates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
          {configTemplates.length > 0 && (
            <div className="flex gap-1">
              {configTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => onDeleteTemplate(tpl.id)}
                  title={`${t("import.config.deleteTemplate")}: ${tpl.name}`}
                  className="p-1 text-[var(--muted-foreground)] hover:text-[var(--negative)] transition-colors"
                >
                  <X size={14} />
                </button>
              ))}
            </div>
          )}
        </div>

        {showSaveTemplate ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder={t("import.config.templateName")}
              className={inputClass + " w-48"}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && templateName.trim()) {
                  onSaveAsTemplate(templateName.trim());
                  setTemplateName("");
                  setShowSaveTemplate(false);
                } else if (e.key === "Escape") {
                  setShowSaveTemplate(false);
                  setTemplateName("");
                }
              }}
            />
            <button
              onClick={() => {
                if (templateName.trim()) {
                  onSaveAsTemplate(templateName.trim());
                  setTemplateName("");
                  setShowSaveTemplate(false);
                }
              }}
              disabled={!templateName.trim()}
              className="p-1.5 rounded-lg bg-[var(--positive)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => {
                setShowSaveTemplate(false);
                setTemplateName("");
              }}
              className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSaveTemplate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            <Save size={16} />
            {t("import.config.saveAsTemplate")}
          </button>
        )}
      </div>

      {/* Source name */}
      <div>
        <label className="block text-sm text-[var(--muted-foreground)] mb-1">
          {t("import.config.sourceName")}
        </label>
        <input
          type="text"
          value={config.name}
          onChange={(e) => updateConfig({ name: e.target.value })}
          className={inputClass}
        />
      </div>

      {/* Basic settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-[var(--muted-foreground)] mb-1">
            {t("import.config.delimiter")}
          </label>
          <select
            value={config.delimiter}
            onChange={(e) => updateConfig({ delimiter: e.target.value })}
            className={selectClass}
          >
            <option value=";">{t("import.config.semicolon")} (;)</option>
            <option value=",">{t("import.config.comma")} (,)</option>
            <option value="\t">{t("import.config.tab")} (↹)</option>
            <option value="|">Pipe (|)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-[var(--muted-foreground)] mb-1">
            {t("import.config.encoding")}
          </label>
          <select
            value={config.encoding}
            onChange={(e) => updateConfig({ encoding: e.target.value })}
            className={selectClass}
          >
            <option value="utf-8">UTF-8</option>
            <option value="windows-1252">Windows-1252</option>
            <option value="iso-8859-1">ISO-8859-1</option>
            <option value="iso-8859-15">ISO-8859-15</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-[var(--muted-foreground)] mb-1">
            {t("import.config.dateFormat")}
          </label>
          <select
            value={config.dateFormat}
            onChange={(e) => updateConfig({ dateFormat: e.target.value })}
            className={selectClass}
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="YYYY/MM/DD">YYYY/MM/DD</option>
            <option value="DD-MM-YYYY">DD-MM-YYYY</option>
            <option value="DD.MM.YYYY">DD.MM.YYYY</option>
            <option value="YYYYMMDD">YYYYMMDD</option>
          </select>
        </div>
      </div>

      {/* Skip lines & header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-[var(--muted-foreground)] mb-1">
            {t("import.config.skipLines")}
          </label>
          <input
            type="number"
            min={0}
            value={config.skipLines}
            onChange={(e) =>
              updateConfig({ skipLines: parseInt(e.target.value) || 0 })
            }
            className={inputClass}
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm cursor-pointer pb-2">
            <input
              type="checkbox"
              checked={config.hasHeader}
              onChange={(e) => updateConfig({ hasHeader: e.target.checked })}
              className="accent-[var(--primary)]"
            />
            {t("import.config.hasHeader")}
          </label>
        </div>
      </div>

      {/* Sign convention */}
      <div>
        <label className="block text-sm text-[var(--muted-foreground)] mb-1">
          {t("import.config.signConvention")}
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="signConvention"
              value="negative_expense"
              checked={config.signConvention === "negative_expense"}
              onChange={() =>
                updateConfig({ signConvention: "negative_expense" })
              }
              className="accent-[var(--primary)]"
            />
            {t("import.config.negativeExpense")}
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="signConvention"
              value="positive_expense"
              checked={config.signConvention === "positive_expense"}
              onChange={() =>
                updateConfig({ signConvention: "positive_expense" })
              }
              className="accent-[var(--primary)]"
            />
            {t("import.config.positiveExpense")}
          </label>
        </div>
      </div>

      {/* Column mapping */}
      {headers.length > 0 && (
        <ColumnMappingEditor
          headers={headers}
          mapping={config.columnMapping}
          amountMode={config.amountMode}
          onMappingChange={(mapping: ColumnMapping) =>
            onConfigChange({ ...config, columnMapping: mapping })
          }
          onAmountModeChange={(mode: AmountMode) =>
            onConfigChange({ ...config, amountMode: mode })
          }
        />
      )}

      {/* File selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            {t("import.config.selectFiles")}
          </h3>
          <button
            onClick={onSelectAllFiles}
            className="text-xs text-[var(--primary)] hover:underline"
          >
            {t("import.config.selectAll")}
          </button>
        </div>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {source.files.map((file) => {
            const isSelected = selectedFiles.some(
              (f) => f.file_path === file.file_path
            );
            const isImported = importedFileNames?.has(file.filename) ?? false;
            return (
              <label
                key={file.file_path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--muted)] cursor-pointer text-sm ${
                  isImported ? "opacity-60" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onFileToggle(file)}
                  className="accent-[var(--primary)]"
                />
                <span className="flex-1">{file.filename}</span>
                {isImported && (
                  <span className="flex items-center gap-1 text-xs text-[var(--positive)]">
                    <Check size={12} />
                    {t("import.config.alreadyImported")}
                  </span>
                )}
                <span className="text-xs text-[var(--muted-foreground)]">
                  {(file.size_bytes / 1024).toFixed(1)} KB
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
