import { useTranslation } from "react-i18next";
import { useImportWizard } from "../hooks/useImportWizard";
import ImportFolderConfig from "../components/import/ImportFolderConfig";
import SourceList from "../components/import/SourceList";
import SourceConfigPanel from "../components/import/SourceConfigPanel";
import FilePreviewTable from "../components/import/FilePreviewTable";
import DuplicateCheckPanel from "../components/import/DuplicateCheckPanel";
import ImportConfirmation from "../components/import/ImportConfirmation";
import ImportProgress from "../components/import/ImportProgress";
import ImportReportPanel from "../components/import/ImportReportPanel";
import WizardNavigation from "../components/import/WizardNavigation";
import ImportHistoryPanel from "../components/import/ImportHistoryPanel";
import { AlertCircle } from "lucide-react";
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
    checkDuplicates,
    executeImport,
    goToStep,
    reset,
    toggleDuplicateRow,
    setSkipAllDuplicates,
  } = useImportWizard();

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
          />
          <WizardNavigation
            onBack={() => goToStep("source-list")}
            onNext={parsePreview}
            onCancel={reset}
            nextLabel={t("import.wizard.preview")}
            nextDisabled={
              state.selectedFiles.length === 0 || !state.sourceConfig.name
            }
          />
        </div>
      )}

      {state.step === "file-preview" && (
        <div className="space-y-6">
          <FilePreviewTable
            rows={state.parsedPreview.slice(0, 20)}
          />
          {state.parsedPreview.length > 20 && (
            <p className="text-sm text-[var(--muted-foreground)] text-center">
              {t("import.preview.moreRows", {
                count: state.parsedPreview.length - 20,
              })}
            </p>
          )}
          <WizardNavigation
            onBack={() => goToStep("source-config")}
            onNext={checkDuplicates}
            onCancel={reset}
            nextLabel={t("import.wizard.checkDuplicates")}
            nextDisabled={
              state.parsedPreview.filter((r) => r.parsed).length === 0
            }
          />
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
            onBack={() => goToStep("file-preview")}
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
    </div>
  );
}
