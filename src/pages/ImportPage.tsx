import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useImportWizard } from "../hooks/useImportWizard";
import ImportFolderConfig from "../components/import/ImportFolderConfig";
import SourceList from "../components/import/SourceList";
import SourceConfigPanel from "../components/import/SourceConfigPanel";
import DuplicateCheckPanel from "../components/import/DuplicateCheckPanel";
import ImportConfirmation from "../components/import/ImportConfirmation";
import ImportProgress from "../components/import/ImportProgress";
import ImportReportPanel from "../components/import/ImportReportPanel";
import WizardNavigation from "../components/import/WizardNavigation";
import ImportHistoryPanel from "../components/import/ImportHistoryPanel";
import FilePreviewModal from "../components/import/FilePreviewModal";
import { AlertCircle, Eye, X, ChevronLeft } from "lucide-react";
import { PageHelp } from "../components/shared/PageHelp";

export default function ImportPage() {
  const { t } = useTranslation();
  const {
    state,
    browseFolder,
    refreshFolder,
    selectSource,
    updateConfig,
    toggleFile,
    selectAllFiles,
    parsePreview,
    parseAndCheckDuplicates,
    executeImport,
    goToStep,
    reset,
    autoDetectConfig,
    toggleDuplicateRow,
    setSkipAllDuplicates,
  } = useImportWizard();

  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handlePreview = useCallback(async () => {
    await parsePreview();
    setShowPreviewModal(true);
  }, [parsePreview]);

  const nextDisabled = state.selectedFiles.length === 0 || !state.sourceConfig.name;

  return (
    <div>
      <div className="relative flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">{t("import.title")}</h1>
        <PageHelp helpKey="import" />
      </div>

      {/* Error banner */}
      {state.error && (
        <div className="mb-4 p-3 rounded-xl bg-[var(--card)] border-2 border-[var(--negative)] flex items-center gap-2">
          <AlertCircle size={16} className="text-[var(--negative)] shrink-0" />
          <p className="text-sm text-[var(--foreground)]">
            {state.error}
          </p>
        </div>
      )}

      {/* Folder config - always visible */}
      <ImportFolderConfig
        folderPath={state.importFolder}
        onBrowse={browseFolder}
        onRefresh={refreshFolder}
        isLoading={state.isLoading}
      />

      {/* Wizard steps */}
      {state.step === "source-list" && (
        <>
          <SourceList
            sources={state.scannedSources}
            configuredSourceNames={state.configuredSourceNames}
            importedFileHashes={state.importedFilesBySource}
            onSelectSource={selectSource}
          />
          <ImportHistoryPanel onChanged={refreshFolder} />
        </>
      )}

      {state.step === "source-config" && state.selectedSource && (
        <div className="space-y-6">
          <SourceConfigPanel
            source={state.selectedSource}
            config={state.sourceConfig}
            selectedFiles={state.selectedFiles}
            headers={state.previewHeaders}
            onConfigChange={updateConfig}
            onFileToggle={toggleFile}
            onSelectAllFiles={selectAllFiles}
            onAutoDetect={autoDetectConfig}
            isLoading={state.isLoading}
          />
          <div className="flex items-center justify-between pt-6 border-t border-[var(--border)]">
            <div>
              <button
                onClick={reset}
                className="flex items-center gap-1 px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <X size={16} />
                {t("common.cancel")}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => goToStep("source-list")}
                className="flex items-center gap-1 px-4 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                <ChevronLeft size={16} />
                {t("import.wizard.back")}
              </button>
              <button
                onClick={handlePreview}
                disabled={nextDisabled || state.isLoading}
                className="flex items-center gap-1 px-4 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye size={16} />
                {t("import.wizard.preview")}
              </button>
              <button
                onClick={parseAndCheckDuplicates}
                disabled={nextDisabled || state.isLoading}
                className="flex items-center gap-1 px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("import.wizard.checkDuplicates")}
              </button>
            </div>
          </div>
        </div>
      )}

      {state.step === "duplicate-check" && state.duplicateResult && (
        <div className="space-y-6">
          <DuplicateCheckPanel
            result={state.duplicateResult}
            excludedIndices={state.excludedDuplicateIndices}
            onToggleRow={toggleDuplicateRow}
            onSkipAll={() => setSkipAllDuplicates(true)}
            onIncludeAll={() => setSkipAllDuplicates(false)}
          />
          <WizardNavigation
            onBack={() => goToStep("source-config")}
            onNext={() => goToStep("confirm")}
            onCancel={reset}
            nextLabel={t("import.wizard.confirm")}
          />
        </div>
      )}

      {state.step === "confirm" && state.duplicateResult && (
        <div className="space-y-6">
          <ImportConfirmation
            sourceName={state.sourceConfig.name}
            config={state.sourceConfig}
            selectedFiles={state.selectedFiles}
            duplicateResult={state.duplicateResult}
            excludedCount={state.excludedDuplicateIndices.size}
          />
          <WizardNavigation
            onBack={() => goToStep("duplicate-check")}
            onNext={executeImport}
            onCancel={reset}
            nextLabel={t("import.wizard.import")}
            showCancel={false}
          />
        </div>
      )}

      {state.step === "importing" && (
        <ImportProgress
          currentFile={state.importProgress.file}
          progress={state.importProgress.current}
          total={state.importProgress.total}
        />
      )}

      {state.step === "report" && state.importReport && (
        <ImportReportPanel report={state.importReport} onDone={reset} />
      )}

      {/* Preview modal */}
      {showPreviewModal && state.parsedPreview.length > 0 && (
        <FilePreviewModal
          rows={state.parsedPreview.slice(0, 20)}
          totalCount={state.parsedPreview.length}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  );
}
